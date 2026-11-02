import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'session-switcher',
  component: 'Pane',
  requestId: 'sessions',
  props: {
    title: 'Sessions',
    isFocused: false,
    bodyColumns: 36,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const SELF = 'self-0000-0000'
const OTHER = 'other-000-0000'
const HEADLESS = 'head-0000-0000'
const DEAD = 'dead-0000-0000'
const REGISTRY: Record<string, object> = {
  '1.json': { pid: 1, sessionId: SELF, cwd: '/w/internal-tools', name: 'tools-55', status: 'busy' },
  '2.json': { pid: 2, sessionId: OTHER, cwd: '/w/monorepo', name: 'mono-a1', status: 'idle' },
  '3.json': { pid: 3, sessionId: HEADLESS, cwd: '/w/monorepo', name: 'mono-sdk', status: 'idle' },
  '4.json': { pid: 4, sessionId: DEAD, cwd: '/w/gone', name: 'gone', status: 'idle' },
}
const OTHER_SUBAGENTS = `/h/.claude/projects/-w-monorepo/${OTHER}/subagents`

test('lists live sessions, drills into subagents and switches', async ($, on) => {
  const ran: string[][] = []
  const viewed: object[] = []
  const toasts: string[] = []

  on('env.get', (_, e) => ({ value: e.name === 'HOME' ? '/h' : undefined }))
  on('session.id', () => ({ value: SELF }))
  on('clock.now', () => ({ value: 1_000_000 }))
  on('clock.every', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'sessions' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.view', (_, e) => {
    viewed.push(e)
    return { value: {} }
  })
  on('ui.toast', (_, e) => {
    toasts.push(String(e.text))
    return { value: undefined }
  })
  on('agent.list', () => ({
    value: [
      { id: 'a1', description: 'Explore schema', type: 'Explore', status: 'running' },
      { id: 'a2', description: 'Old one', type: 'Explore', status: 'completed' },
    ],
  }))
  on('fs.list', (_, e) => {
    if (e.path === '/h/.claude/sessions') {
      return { value: Object.keys(REGISTRY).map(name => ({ name, kind: 'file', size: 1, mtimeMs: 0 })) }
    }
    if (e.path === OTHER_SUBAGENTS) {
      return {
        value: [
          { name: 'agent-b1.meta.json', kind: 'file', size: 1, mtimeMs: 999_000 },
          { name: 'agent-b1.jsonl', kind: 'file', size: 1, mtimeMs: 999_000 },
          { name: 'agent-b2.meta.json', kind: 'file', size: 1, mtimeMs: 999_000 },
        ],
      }
    }
    throw new Error('ENOENT')
  })
  on('fs.read', (_, e) => {
    const name = String(e.path).split('/').at(-1) ?? ''
    if (REGISTRY[name]) return { value: JSON.stringify(REGISTRY[name]) }
    if (name === 'agent-b1.meta.json') return { value: '{"description":"Run tests","agentType":"general-purpose"}' }
    if (name === 'agent-b2.meta.json') return { value: '{"description":"Done","finished":true}' }
    throw new Error('ENOENT')
  })
  on('process.run', (_, e) => {
    ran.push([...e.argv])
    if (e.argv[0] === 'ps') return { value: { exitCode: 0, stdout: '1 ttys000\n2 ttys004\n3 ??\n', stderr: '' } }
    if (e.argv[1] === 'list-panes') {
      return { value: { exitCode: 0, stdout: '/dev/ttys004\twork:2.1\n', stderr: '' } }
    }
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/w/internal-tools', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  // The dead pid is left out; projects head their sessions.
  expect(await ui.find({ type: 'Text', text: /gone/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /^monorepo$/ })).toBeDefined()

  // Drilling into this session lists its running agents, and a press views one.
  await ui.press({ key: `x:${SELF}` })
  expect(await ui.find({ key: 'a:a2' })).toBeUndefined()
  await ui.press({ key: 'a:a1' })
  expect(viewed).toEqual([{ agentId: 'a1' }])

  // Another session's unfinished subagents, read from its subagents folder.
  await ui.press({ key: `x:${OTHER}` })
  expect(await ui.find({ type: 'Text', text: /Run tests/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Done/ })).toBeUndefined()

  // Switching goes through tmux; a headless session only explains itself.
  await ui.press({ key: `s:${OTHER}` })
  expect(ran.filter(argv => argv[0] === 'tmux' && argv[1] !== 'list-panes')).toEqual([
    ['tmux', 'switch-client', '-t', 'work'],
    ['tmux', 'select-window', '-t', 'work:2'],
    ['tmux', 'select-pane', '-t', 'work:2.1'],
  ])
  await ui.press({ key: `s:${HEADLESS}` })
  expect(toasts.at(-1)).toMatch(/headless/)
  await ui.unmount()
})
