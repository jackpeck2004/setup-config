import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'terminal',
  component: 'Pane',
  requestId: 'terminal',
  props: {
    title: 'Terminal',
    isFocused: true,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('keys reach tmux once and the captured screen is drawn', async ($, on) => {
  const calls: string[][] = []
  // Stands for tmux: the session exists, and each exchange answers a screen.
  on('process.run', (_, e) => {
    calls.push([...e.argv])
    return {
      value: {
        exitCode: 0,
        stdout: '2,1,1\n$ ls\n$ \n',
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    }
  })
  on('command.register', () => ({ value: { command: 'terminal' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/work/my.app', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  // The kit lays out no region by itself; the pane sizes it from bodyColumns/bodyRows.
  await ui.resize({ columns: 40, rows: 9 })
  await ui.key({ key: 'l' })
  await ui.key({ key: 's' })
  await ui.key({ key: 'return' })
  await ui.advance(300)

  const sends = calls.flat().join(' ')
  expect(calls[0]).toEqual(['tmux', 'has-session', '-t', '=claude-my-app'])
  expect(sends.match(/send-keys/g)?.length ?? 0).toBeGreaterThan(0)
  // Each key is sent once, however many posts carried it.
  expect(calls.filter(c => c.includes('Enter'))).toHaveLength(1)
  expect(await ui.find({ type: 'Text', text: '$ ls', in: 'screen' })).toBeDefined()
  await ui.unmount()
})

test('the command field runs a line, and ^C sends ctrl+c', async ($, on) => {
  const calls: string[][] = []
  on('process.run', (_, e) => {
    calls.push([...e.argv])
    return {
      value: { exitCode: 0, stdout: '0,0,1\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    }
  })
  on('command.register', () => ({ value: { command: 'terminal' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/work/app', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.input({ key: 'command', text: 'ls -la' })
  await ui.input({ key: 'command', text: '^C' })

  expect(calls).toContainEqual([
    'tmux', 'send-keys', '-t', 'claude-app', '-l', '--', 'ls -la', ';',
    'send-keys', '-t', 'claude-app', 'Enter', ';',
  ])
  expect(calls).toContainEqual(['tmux', 'send-keys', '-t', 'claude-app', 'C-c', ';'])
  await ui.unmount()
})
