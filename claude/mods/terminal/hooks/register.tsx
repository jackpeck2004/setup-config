import type { EngineInterface, Register } from 'claude-code'

import { cleanLine, EMPTY_SCREEN, sendKeysArgs } from './protocol'
import type { Post, Screen } from './protocol'

const PANE = 'terminal'
const CURSOR_FORMAT = '#{cursor_x},#{cursor_y},#{cursor_flag}'

// The pane is a view onto a tmux session named after the project, so the shell
// outlives the pane, a reload and the session: `tmux attach -t <name>` reaches
// it from any other terminal too.
const term = {
  cwd: '.',
  target: 'claude',
  isStarted: false,
  size: { columns: 0, rows: 0 },
  instance: '',
  sent: 0,
  screen: EMPTY_SCREEN as Screen,
  isBusy: false,
}

async function start($: EngineInterface, post: Post): Promise<string | undefined> {
  if (term.isStarted) return undefined
  try {
    const found = await $.process.run(['tmux', 'has-session', '-t', `=${term.target}`])
    if (found.exitCode !== 0) {
      const created = await $.process.run([
        'tmux', 'new-session', '-d', '-s', term.target, '-c', term.cwd,
        '-x', String(post.columns), '-y', String(post.rows),
      ])
      if (created.exitCode !== 0) return created.stderr.trim() || 'tmux could not start.'
    }
  } catch {
    return 'tmux was not found. Install it (brew install tmux) and reopen /terminal.'
  }
  term.isStarted = true
  term.size = { columns: 0, rows: 0 }

  return undefined
}

// Sends the new keys, follows the pane's size, and captures the screen,
// all in one tmux call.
async function exchange($: EngineInterface, post: Post): Promise<Screen> {
  const error = await start($, post)
  if (error !== undefined) return { ...EMPTY_SCREEN, ack: term.sent, error }

  if (post.instance !== term.instance) {
    term.instance = post.instance
    term.sent = 0
  }
  const { target } = term
  const keys = post.keys.filter(key => key.seq > term.sent)
  const argv = ['tmux', ...sendKeysArgs(target, keys)]
  if (post.columns !== term.size.columns || post.rows !== term.size.rows) {
    argv.push('resize-window', '-t', target, '-x', String(post.columns), '-y', String(post.rows), ';')
  }
  argv.push('display-message', '-p', '-t', target, CURSOR_FORMAT, ';', 'capture-pane', '-p', '-t', target)

  const ran = await $.process.run(argv)
  if (ran.exitCode !== 0) {
    // The shell exited and took the session with it: the next post starts a new one.
    term.isStarted = false
    return { ...term.screen, ack: term.sent }
  }
  term.size = { columns: post.columns, rows: post.rows }
  term.sent = Math.max(term.sent, ...keys.map(key => key.seq))

  const [cursorLine = '', ...lines] = ran.stdout.replace(/\n$/, '').split('\n')
  const [x = 0, y = 0, flag = 0] = cursorLine.split(',').map(Number)

  return {
    lines: lines.map(cleanLine),
    cursor: { x, y, isVisible: flag === 1 },
    ack: term.sent,
  }
}

// Runs one line typed in the command field: `^C` style lines send that control
// key alone; anything else is typed into the shell and entered.
async function sendLine($: EngineInterface, line: string) {
  const control = /^\^([a-z])$/i.exec(line.trim())
  const keys = control?.[1] !== undefined
    ? [{ key: control[1].toLowerCase(), ctrl: true as const }]
    : [...[...line].map(key => ({ key })), { key: 'return' }]
  await $.process.run(['tmux', ...sendKeysArgs(term.target, keys)]).catch(() => undefined)
  // Draws the field again, empty.
  $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    term.cwd = e.cwd
    const name = e.cwd.split('/').filter(Boolean).pop() ?? 'shell'
    term.target = `claude-${name.replace(/[^A-Za-z0-9_-]/g, '-')}`
    await $.command.register({
      name: 'terminal',
      description: 'Open an integrated terminal (tmux) beside the chat',
    })

    return next(e)
  })

  on('command.run', { command: 'terminal' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Terminal', focus: true })

    return { text: `Terminal opened (tmux session ${term.target}). Type a command and press Enter; Escape returns to the chat.` }
  })

  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    const post = e.data as Post
    const isValid =
      typeof post?.instance === 'string' &&
      Number.isInteger(post.columns) && post.columns > 0 &&
      Number.isInteger(post.rows) && post.rows > 0 &&
      Array.isArray(post.keys)
    // A poll while a call is out waits for the next one; keys stay queued.
    if (!isValid || term.isBusy) return {}

    term.isBusy = true
    try {
      term.screen = await exchange($, post)
    } finally {
      term.isBusy = false
    }

    return { props: term.screen }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>The terminal needs Claude Code's terminal or desktop app.</Text>
    }
    const { Box, Client, Input, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor wrap="truncate">
          {term.target} · ^C sends ctrl+c · click the screen for raw keys · tmux attach -t {term.target}
        </Text>
        {/* A fixed size: sized to what it draws, the empty screen would get no rows. */}
        <Client
          key="screen"
          module="./screen.tsx"
          props={term.screen}
          width={e.props.bodyColumns}
          height={Math.max(1, e.props.scroll.bodyRows - 2)}
        />
        {/* Takes the keys when the pane does, so the terminal needs no mouse. */}
        <Input
          key="command"
          label="$"
          placeholder="command, Enter to run"
          value=""
          submitLabel="run"
          autoFocus
          onSubmit={line => void sendLine($, line)}
        />
      </Box>
    )
  })
}
