import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import path from 'path'
import os from 'os'
import { createJob, appendLog, finishJob, failJob, getJob } from '@/lib/jobs'
import { patchPackageJson, WORKSPACE } from '@/lib/workspace'

const SCRIPT = path.join(
  os.homedir(),
  '.claude/skills/new-webapp-project/scripts/add-supabase.sh'
)

const ANSI_RE = /\x1B\[[0-9;]*[mGKHF]/g
function stripAnsi(s: string) {
  return s.replace(ANSI_RE, '')
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const jobId = randomUUID()
  createJob(jobId)

  const home = os.homedir()
  const PATH = [
    `${home}/.local/bin`,
    '/usr/local/sbin',
    '/usr/local/bin',
    '/usr/sbin',
    '/usr/bin',
    '/sbin',
    '/bin',
    process.env.PATH,
  ].filter(Boolean).join(':')

  const child = spawn('bash', [SCRIPT, name], {
    cwd: WORKSPACE,
    env: { ...process.env, HOME: home, PATH },
  })

  const feed = (chunk: Buffer) => {
    for (const line of chunk.toString().split('\n')) {
      const trimmed = line.trimEnd()
      if (trimmed) appendLog(jobId, trimmed)
    }
  }

  child.stdout.on('data', feed)
  child.stderr.on('data', feed)

  child.on('close', (code) => {
    const job = getJob(jobId)
    const fullOutput = job?.logs.map(stripAnsi).join('\n') || ''

    const supabaseMatch = fullOutput.match(/Supabase\s*:\s*(https:\/\/app\.supabase\.com\/\S+)/)
    const supabaseUrl = supabaseMatch?.[1] ?? ''

    if (code === 0) {
      if (supabaseUrl) {
        try {
          patchPackageJson(path.join(WORKSPACE, name), {
            title: name,
            supabaseUrl,
          })
        } catch (e) {
          appendLog(jobId, `[creator] Warning: could not patch package.json: ${e}`)
        }
      }
      finishJob(jobId, { vercelUrl: '', githubUrl: '', supabaseUrl, localPath: path.join(WORKSPACE, name) })
    } else {
      failJob(jobId, `Script exited with code ${code}`)
    }
  })

  return NextResponse.json({ jobId })
}
