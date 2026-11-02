import type { ClientKeyEvent } from 'claude-code'

// A key the screen forwards, numbered so the hooks module sends each once.
export type Key = ClientKeyEvent & { seq: number }

// What the screen posts to the hooks module.
export type Post = {
  instance: string
  columns: number
  rows: number
  keys: Key[]
}

// What the hooks module hands the screen as props.
export type Screen = {
  lines: string[]
  cursor: { x: number; y: number; isVisible: boolean }
  // The highest key seq already sent to tmux.
  ack: number
  error?: string
}

export const EMPTY_SCREEN: Screen = {
  lines: [],
  cursor: { x: 0, y: 0, isVisible: false },
  ack: 0,
}

const NAMED: Record<string, string> = {
  return: 'Enter',
  enter: 'Enter',
  tab: 'Tab',
  backspace: 'BSpace',
  delete: 'DC',
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  home: 'Home',
  end: 'End',
  pageup: 'PPage',
  pagedown: 'NPage',
  insert: 'IC',
  space: 'Space',
}

// One key as a tmux send-keys argument: `literal` goes after `-l`.
export function toTmuxKey(key: ClientKeyEvent): { literal: boolean; text: string } {
  if (key.key === 'tab' && key.shift) return { literal: false, text: 'BTab' }
  const named = NAMED[key.key]
  const base = named ?? key.key
  const modifiers = (key.ctrl ? 'C-' : '') + (key.meta ? 'M-' : '')
  if (modifiers !== '') return { literal: false, text: modifiers + base }
  if (named !== undefined) return { literal: false, text: named }
  return { literal: true, text: key.key }
}

// The send-keys commands for a run of keys, literal text grouped, joined with
// tmux's `;` so one tmux call sends them all.
export function sendKeysArgs(target: string, keys: readonly ClientKeyEvent[]): string[] {
  const args: string[] = []
  let literal = ''
  const flush = () => {
    if (literal === '') return
    // tmux reads a trailing `;` as its command separator unless escaped.
    const text = literal.endsWith(';') ? literal.slice(0, -1) + '\\;' : literal
    args.push('send-keys', '-t', target, '-l', '--', text, ';')
    literal = ''
  }
  for (const key of keys) {
    const mapped = toTmuxKey(key)
    if (mapped.literal) {
      literal += mapped.text
      continue
    }
    flush()
    args.push('send-keys', '-t', target, mapped.text, ';')
  }
  flush()

  return args
}

// Replaces the control characters a Text refuses.
export function cleanLine(line: string): string {
  return line.replace(/[\u0000-\u001f\u007f]/g, ' ')
}
