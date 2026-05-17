import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { patchPackageJson } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  const { localPath, title, description, vercelUrl, githubUrl, supabaseUrl } = await req.json()

  if (!localPath || !title) {
    return NextResponse.json({ error: 'localPath and title are required' }, { status: 400 })
  }

  if (!fs.existsSync(localPath)) {
    return NextResponse.json({ error: 'Path does not exist' }, { status: 400 })
  }

  try {
    patchPackageJson(localPath, { title, description, vercelUrl, githubUrl, supabaseUrl })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
