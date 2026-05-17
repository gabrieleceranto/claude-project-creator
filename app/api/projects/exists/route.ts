import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { WORKSPACE } from '@/lib/workspace'

export function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const exists = fs.existsSync(path.join(WORKSPACE, name))
  return NextResponse.json({ exists })
}
