export type SubagentRow = {
  id: string
  description: string
  type: string
  status: string
}

export type SessionRow = {
  sessionId: string
  pid: number
  name: string
  cwd: string
  status: string
  isSelf: boolean
  isHeadless: boolean
  // `session:window.pane`, when the session runs in a tmux pane
  tmuxTarget?: string
  subagents: SubagentRow[]
}

declare module 'claude-code' {
  interface PluginState {
    'session-switcher': {
      sessions: Shaped<SessionRow[]>
      expanded: string[]
    }
  }
}
