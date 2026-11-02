import type { ClientKeyEvent, ClientModule } from 'claude-code'

import type { Key, Post, Screen } from './protocol'

type State = { instance: string; seq: number; queue: Key[] }

const POLL_MS = 150

// Draws the tmux screen the hooks module captured and forwards each key to it.
// Every post carries the keys the hooks module has not acknowledged yet, so a
// post that replaces an undelivered one in the same frame loses nothing.
const TerminalScreen: ClientModule<Screen, State> = (screen, surface) => {
  const { Box, Text } = surface.elements
  const pending = () =>
    (surface.state?.queue ?? []).filter(key => key.seq > screen.ack)
  const post = (keys: Key[]) => {
    if (surface.columns === 0 || surface.rows === 0) return
    const data: Post = {
      instance: surface.state?.instance ?? '',
      columns: surface.columns,
      rows: surface.rows,
      keys,
    }
    surface.post(data)
  }

  if (surface.state === undefined) {
    surface.setState({
      instance: Math.random().toString(36).slice(2),
      seq: 0,
      queue: [],
    })
    surface.every(POLL_MS, () => post(surface.state?.queue ?? []))
  }

  surface.onKey((event: ClientKeyEvent) => {
    const state = surface.state
    if (state === undefined) return
    const seq = state.seq + 1
    const queue = [...pending(), { ...event, seq }]
    surface.setState({ ...state, seq, queue })
    post(queue)
  })

  if (screen.error !== undefined) {
    return <Text color="red">{screen.error}</Text>
  }

  return (
    <Box flexDirection="column">
      {screen.lines.map((line, row) => {
        if (!screen.cursor.isVisible || row !== screen.cursor.y) {
          return <Text wrap="truncate">{line || ' '}</Text>
        }
        const padded = line.padEnd(screen.cursor.x + 1)

        return (
          <Box flexDirection="row">
            <Text wrap="truncate">{padded.slice(0, screen.cursor.x)}</Text>
            <Text inverse>{padded[screen.cursor.x]}</Text>
            <Text wrap="truncate">{padded.slice(screen.cursor.x + 1)}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

export default TerminalScreen
