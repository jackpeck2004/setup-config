import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SessionRow, SubagentRow } from '../types'

const PANE = 'sessions'
const POLL_MS = 2000
// An unfinished subagent whose transcript has been silent this long was
// interrupted rather than running (its meta never got `finished`).
const STALE_SUBAGENT_MS = 15 * 60 * 1000
const DONE: readonly string[] = ['completed', 'failed', 'killed']

const sessions = atom({ plugin: 'session-switcher', key: 'sessions' } as const, [], {
  shape: 'sessions-1',
})
const expanded = atom({ plugin: 'session-switcher', key: 'expanded' } as const, [])

type Registry = {
  pid: number
  sessionId: string
  cwd: string
  name?: string
  status?: string
  kind?: string
  startedAt?: number
}

// ~/.claude/projects/<cwd with every non-alphanumeric as '-'>
const projectDir = (cwd: string) => cwd.replace(/[^a-zA-Z0-9]/g, '-')
const basename = (path: string) => path.split('/').filter(Boolean).at(-1) ?? path

async function configDir($: EngineInterface) {
  return (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${await $.env.get('HOME')}/.claude`
}

async function readRegistry($: EngineInterface, dir: string): Promise<Registry[]> {
  const entries = await $.fs.list(`${dir}/sessions`).catch(() => [])
  const rows = await Promise.all(
    entries
      .filter(entry => entry.kind === 'file' && entry.name.endsWith('.json'))
      .map(entry =>
        $.fs
          .read(`${dir}/sessions/${entry.name}`)
          .then(text => JSON.parse(text) as Registry)
          .catch(() => undefined),
      ),
  )

  return rows.filter((row): row is Registry => !!row?.pid && !!row.sessionId)
}

// pid -> tty name ('ttys003', or '??' for none), for the pids still alive
async function liveTtys($: EngineInterface, pids: number[]) {
  const ttys = new Map<number, string>()
  if (pids.length === 0) return ttys
  const ps = await $.process
    .run(['ps', '-o', 'pid=,tty=', '-p', pids.join(',')])
    .catch(() => undefined)
  for (const line of ps?.stdout.split('\n') ?? []) {
    const [pid, tty] = line.trim().split(/\s+/)
    if (pid) ttys.set(Number(pid), tty ?? '??')
  }

  return ttys
}

// '/dev/ttys003' -> 'main:1.0'
async function tmuxPanes($: EngineInterface) {
  const panes = new Map<string, string>()
  const listed = await $.process
    .run(['tmux', 'list-panes', '-a', '-F', '#{pane_tty}\t#{session_name}:#{window_index}.#{pane_index}'])
    .catch(() => undefined)
  if (listed?.exitCode !== 0) return panes
  for (const line of listed.stdout.split('\n')) {
    const [tty, target] = line.split('\t')
    if (tty && target) panes.set(tty, target)
  }

  return panes
}

async function otherSubagents($: EngineInterface, dir: string, row: Registry, now: number) {
  const base = `${dir}/projects/${projectDir(row.cwd)}/${row.sessionId}/subagents`
  const entries = await $.fs.list(base).catch(() => [])
  const mtimes = new Map(entries.map(entry => [entry.name, entry.mtimeMs]))
  const found = await Promise.all(
    entries
      .filter(entry => entry.name.endsWith('.meta.json'))
      .map(async (entry): Promise<SubagentRow | undefined> => {
        const name = entry.name.replace(/\.meta\.json$/, '')
        const lastWrite = mtimes.get(`${name}.jsonl`) ?? entry.mtimeMs
        if (now - lastWrite > STALE_SUBAGENT_MS) return undefined
        const meta = await $.fs
          .read(`${base}/${entry.name}`)
          .then(text => JSON.parse(text) as { finished?: boolean; description?: string; agentType?: string })
          .catch(() => undefined)
        if (!meta || meta.finished) return undefined

        return {
          id: name.replace(/^agent-/, ''),
          description: meta.description ?? name,
          type: meta.agentType ?? 'agent',
          status: 'running',
        }
      }),
  )

  return found.filter((row): row is SubagentRow => !!row)
}

async function ownSubagents($: EngineInterface): Promise<SubagentRow[]> {
  const agents = await $.agent.list().catch(() => [])

  return agents
    .filter(agent => !DONE.includes(agent.status))
    .map(agent => ({
      id: agent.id,
      description: agent.description,
      type: agent.type,
      status: agent.status,
    }))
}

async function snapshot($: EngineInterface): Promise<SessionRow[]> {
  const dir = await configDir($)
  const registry = await readRegistry($, dir)
  const [ttys, panes, selfId, now] = await Promise.all([
    liveTtys($, registry.map(row => row.pid)),
    tmuxPanes($),
    $.session.id(),
    $.clock.now(),
  ])
  const live = registry.filter(row => ttys.has(row.pid))
  const rows = await Promise.all(
    live.map(async (row): Promise<SessionRow> => {
      const tty = ttys.get(row.pid) ?? '??'
      const isSelf = row.sessionId === selfId

      return {
        sessionId: row.sessionId,
        pid: row.pid,
        name: row.name ?? row.sessionId.slice(0, 8),
        cwd: row.cwd,
        status: row.status ?? 'unknown',
        isSelf,
        isHeadless: tty === '??',
        tmuxTarget: panes.get(`/dev/${tty}`),
        subagents: isSelf ? await ownSubagents($) : await otherSubagents($, dir, row, now),
      }
    }),
  )
  const startedAt = new Map(live.map(row => [row.sessionId, row.startedAt ?? 0]))

  return rows.sort(
    (a, b) =>
      Number(b.isSelf) - Number(a.isSelf) ||
      a.cwd.localeCompare(b.cwd) ||
      (startedAt.get(a.sessionId) ?? 0) - (startedAt.get(b.sessionId) ?? 0),
  )
}

async function switchTo($: EngineInterface, row: SessionRow) {
  if (row.isSelf) return void $.ui.view({})
  if (row.isHeadless) {
    return $.ui.toast(`${row.name} is headless (driven by another app): nothing to switch to`)
  }
  if (!row.tmuxTarget) return $.ui.toast(`${row.name} is not running in a tmux pane`)
  const session = row.tmuxTarget.split(':')[0] ?? row.tmuxTarget
  const window = row.tmuxTarget.split('.')[0] ?? row.tmuxTarget
  for (const args of [
    ['switch-client', '-t', session],
    ['select-window', '-t', window],
    ['select-pane', '-t', row.tmuxTarget],
  ]) {
    const ran = await $.process.run(['tmux', ...args]).catch(() => undefined)
    if (ran?.exitCode !== 0) {
      return $.ui.toast(`tmux ${args[0]} failed: ${ran?.stderr.trim() || 'is this session inside tmux?'}`)
    }
  }
}

// Skips the write (and so the redraw) when nothing changed since the last poll
let lastJson = ''

async function refresh($: EngineInterface) {
  const rows = await snapshot($)
  const json = JSON.stringify(rows)
  if (json === lastJson) return
  lastJson = json
  await update($, sessions, () => rows)
}

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'sessions',
      description: 'Show every running Claude Code session in a sidebar',
    })
    await refresh($)
    $.clock.every(POLL_MS, () => void refresh($).catch(() => undefined))
    void $.ui.open({ id: PANE, title: 'Sessions', columns: 36 })

    return started
  })

  on('command.run', { command: 'sessions' }, async $ => {
    await refresh($)
    // Takes the keys, so a row's number switches to it at once.
    await $.ui.open({ id: PANE, title: 'Sessions', columns: 36, focus: true })

    return { text: 'Sessions sidebar opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const rows = await read($, sessions)
    const open = await read($, expanded)
    const viewing = e.props.view.agentId
    const toggle = (id: string) =>
      void update($, expanded, ids => (ids.includes(id) ? ids.filter(one => one !== id) : [...ids, id]))

    if (rows.length === 0) return <Text dimColor>No running sessions found.</Text>

    return (
      <Box flexDirection="column">
        {rows.map((row, index) => {
          const isOpen = open.includes(row.sessionId)
          const project = basename(row.cwd)
          const isNewProject = index === 0 || rows[index - 1]?.cwd !== row.cwd
          const where = row.isSelf ? 'this' : row.isHeadless ? 'headless' : row.tmuxTarget ?? 'no tmux'

          return (
            <Box key={row.sessionId} flexDirection="column">
              {isNewProject && (
                <Text bold wrap="truncate-end">
                  {project}
                </Text>
              )}
              <Box flexDirection="row">
                {row.subagents.length > 0 ? (
                  <Button key={`x:${row.sessionId}`} plain onPress={() => toggle(row.sessionId)}>
                    {isOpen ? '▾' : '▸'}
                  </Button>
                ) : (
                  <Text> </Text>
                )}
                <Button
                  key={`s:${row.sessionId}`}
                  plain
                  hotkey={index < 9 ? String(index + 1) : undefined}
                  onPress={() => void switchTo($, row)}
                >
                  <Text color={row.status === 'busy' ? 'green' : undefined}>
                    {row.status === 'busy' ? '●' : '○'}
                  </Text>{' '}
                  {row.isSelf && !viewing ? <Text bold>{row.name}</Text> : row.name}{' '}
                  <Text dimColor>
                    {where}
                    {row.subagents.length > 0 ? ` · ${row.subagents.length} agents` : ''}
                  </Text>
                </Button>
              </Box>
              {isOpen &&
                row.subagents.map(agent =>
                  row.isSelf ? (
                    <Box key={agent.id} paddingLeft={3}>
                      <Button
                        key={`a:${agent.id}`}
                        plain
                        onPress={() => void $.ui.view({ agentId: agent.id })}
                      >
                        {viewing === agent.id ? <Text bold>{agent.description}</Text> : agent.description}{' '}
                        <Text dimColor>
                          {agent.type} · {agent.status}
                        </Text>
                      </Button>
                    </Box>
                  ) : (
                    <Box key={agent.id} paddingLeft={3}>
                      <Text wrap="truncate-end">
                        {agent.description} <Text dimColor>{agent.type}</Text>
                      </Text>
                    </Box>
                  ),
                )}
            </Box>
          )
        })}
      </Box>
    )
  })
}
