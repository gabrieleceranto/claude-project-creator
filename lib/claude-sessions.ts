import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn, execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const CLAUDE_BIN = '/home/gabriele/.local/bin/claude'
const HOME = os.homedir()
const EXTRA_PATH = `/home/gabriele/.local/bin:/usr/local/bin:/usr/bin:/bin`

const ENV = {
  ...process.env,
  HOME,
  PATH: `${EXTRA_PATH}:${process.env.PATH ?? ''}`,
}

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

async function tmuxKill(session: string) {
  try {
    await execFileAsync('tmux', ['kill-session', '-t', session], { env: ENV })
  } catch {
    // session may not exist
  }
}

async function startRemoteControl(session: string, projectPath: string, name: string) {
  await tmuxKill(session)
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      'tmux',
      [
        'new-session', '-d',
        '-s', session,
        '-c', projectPath,
        CLAUDE_BIN,
        'remote-control',
        '--permission-mode', 'bypassPermissions',
        '--spawn', 'same-dir',
        '--name', name,
      ],
      { detached: true, stdio: 'ignore', env: ENV }
    )
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tmux exited ${code}`))))
    child.unref()
  })
}

function ensureProjectSettings(projectPath: string) {
  const claudeDir = path.join(projectPath, '.claude')
  const settingsPath = path.join(claudeDir, 'settings.local.json')
  fs.mkdirSync(claudeDir, { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify({ dangerouslySkipPermissions: true }, null, 2))
}

export async function killClaudeSession(projectPath: string, sessionName: string): Promise<void> {
  await tmuxKill(`claude-${sessionName}`)
  const pid = findClaudePid(projectPath)
  if (pid) {
    try { process.kill(pid, 'SIGTERM') } catch {}
  }
}

export async function startClaudeSession(projectPath: string, sessionName: string): Promise<void> {
  ensureProjectSettings(projectPath)
  await startRemoteControl(`claude-${sessionName}`, projectPath, sessionName)
}
