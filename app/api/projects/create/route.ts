import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { createJob, appendLog, finishJob, failJob, getJob } from '@/lib/jobs'
import { patchPackageJson, WORKSPACE } from '@/lib/workspace'

const SCRIPT = path.join(
  os.homedir(),
  '.claude/skills/new-webapp-project/scripts/new-webapp-project.sh'
)

const ANSI_RE = /\x1B\[[0-9;]*[mGKHF]/g
function stripAnsi(s: string) {
  return s.replace(ANSI_RE, '')
}

export async function POST(req: NextRequest) {
  const { name, title, description } = await req.json()

  if (!name || !/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(name)) {
    return NextResponse.json(
      { error: 'Project name must be kebab-case (e.g. my-project)' },
      { status: 400 }
    )
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const projectPath = path.join(WORKSPACE, name)
  if (fs.existsSync(projectPath)) {
    return NextResponse.json({ error: `Directory already exists: ${projectPath}` }, { status: 400 })
  }

  if (!fs.existsSync(SCRIPT)) {
    return NextResponse.json(
      { error: `Script not found: ${SCRIPT}` },
      { status: 500 }
    )
  }

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

    const githubMatch = fullOutput.match(/GitHub\s*:\s*(https:\/\/github\.com\/\S+)/)
    const vercelMatch = fullOutput.match(/Vercel\s*:\s*(https:\/\/vercel\.com\/\S+)/)
    const supabaseMatch = fullOutput.match(/Supabase\s*:\s*(https:\/\/app\.supabase\.com\/\S+)/)

    const githubUrl = githubMatch?.[1] ?? ''
    const vercelUrl = vercelMatch?.[1] ?? ''
    const supabaseUrl = supabaseMatch?.[1] ?? ''

    if (code === 0) {
      try {
        patchPackageJson(projectPath, {
          title,
          description: description || '',
          vercelUrl,
          githubUrl,
          supabaseUrl,
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        appendLog(jobId, `[creator] Warning: could not patch package.json: ${e}`)
      }
      finishJob(jobId, { vercelUrl, githubUrl, supabaseUrl, localPath: projectPath })
    } else {
      failJob(jobId, `Script exited with code ${code}`)
    }
  })

  return NextResponse.json({ jobId })
}
