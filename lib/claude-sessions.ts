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

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function tmuxKill(session: string) {
  try {
    await execFileAsync('tmux', ['kill-session', '-t', session], { env: ENV })
  } catch {
    // session may not exist
  }
}

async function tmuxCapture(session: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('tmux', ['capture-pane', '-t', session, '-p'], { env: ENV })
    return stdout
  } catch {
    return ''
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
        CLAUDE_BIN, 'remote-control',
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

async function acceptWorkspaceTrust(projectPath: string, name: string) {
  // Write project settings before launching so spawned sessions skip permission prompts
  ensureProjectSettings(projectPath)

  const trustSession = `trust-${name}`
  await tmuxKill(trustSession)

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'tmux',
      ['new-session', '-d', '-s', trustSession, '-c', projectPath, CLAUDE_BIN],
      { detached: true, stdio: 'ignore', env: ENV }
    )
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`trust tmux exited ${code}`))))
    child.unref()
  })

  // Wait for the trust dialog to render, then press Enter to accept "Yes, I trust this folder"
  await sleep(3000)
  await execFileAsync('tmux', ['send-keys', '-t', trustSession, '', ''], { env: ENV })
  await sleep(500)
  await execFileAsync('tmux', ['send-keys', '-t', trustSession, 'Enter', ''], { env: ENV })
  await sleep(1500)
  await tmuxKill(trustSession)
}

export async function startClaudeSession(projectPath: string, sessionName: string): Promise<void> {
  const tmuxSession = `claude-${sessionName}`

  // Always ensure the project settings are written (idempotent)
  ensureProjectSettings(projectPath)

  await startRemoteControl(tmuxSession, projectPath, sessionName)

  // Give the process 2s to either start cleanly or fail with "Workspace not trusted"
  await sleep(2000)
  const output = await tmuxCapture(tmuxSession)

  if (output.includes('Workspace not trusted')) {
    await tmuxKill(tmuxSession)
    await acceptWorkspaceTrust(projectPath, sessionName)
    // Retry remote-control now that the workspace is trusted
    await startRemoteControl(tmuxSession, projectPath, sessionName)
  }
}
