import { NextRequest, NextResponse } from 'next/server'
import { findClaudePid, startClaudeSession } from '@/lib/claude-sessions'

export async function GET(req: NextRequest) {
  const projectPath = req.nextUrl.searchParams.get('path')
  if (!projectPath) return NextResponse.json({ error: 'path required' }, { status: 400 })

  const pid = findClaudePid(projectPath)
  return NextResponse.json({ running: pid !== null, pid })
}

export async function POST(req: NextRequest) {
  const { path: projectPath, name } = await req.json()
  if (!projectPath || !name) {
    return NextResponse.json({ error: 'path and name required' }, { status: 400 })
  }

  const existingPid = findClaudePid(projectPath)
  if (existingPid) {
    return NextResponse.json({ running: true, pid: existingPid })
  }

  try {
    await startClaudeSession(projectPath, name)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  return NextResponse.json({ started: true })
}
