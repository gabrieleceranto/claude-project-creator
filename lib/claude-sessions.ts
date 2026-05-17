import fs from 'fs'
import os from 'os'
import { spawn } from 'child_process'

const CLAUDE_BIN = '/home/gabriele/.local/bin/claude'

export function findClaudePid(projectPath: string): number | null {
  let resolved: string
  try {
    resolved = fs.realpathSync(projectPath)
  } catch {
    return null
  }

  try {
    const pids = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d))
    for (const pid of pids) {
      try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8').replace(/\0/g, ' ')
        const cwd = fs.realpathSync(`/proc/${pid}/cwd`)
        // cmdline shows "claude remote-control" (no --), match either form
        if (
          cmdline.includes('claude') &&
          cmdline.includes('remote-control') &&
          cwd === resolved
        ) {
          return parseInt(pid)
        }
      } catch {
        // process vanished or no permission — skip
      }
    }
  } catch {}

  return null
}

export function startClaudeSession(projectPath: string, sessionName: string): void {
  // claude remote-control needs a real TTY — use a detached tmux session to provide one
  const tmuxSession = `claude-${sessionName}`
  const cmd = `${CLAUDE_BIN} remote-control --dangerously-skip-permissions`

  const child = spawn(
    'tmux',
    ['new-session', '-d', '-s', tmuxSession, '-c', projectPath, cmd],
    {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, HOME: os.homedir() },
    }
  )
  child.unref()
}
