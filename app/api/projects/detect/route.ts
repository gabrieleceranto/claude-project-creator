import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const localPath = req.nextUrl.searchParams.get('path')
  if (!localPath) return NextResponse.json({ error: 'path is required' }, { status: 400 })

  const pkgPath = path.join(localPath, 'package.json')
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    return NextResponse.json({
      name: pkg.name || '',
      description: pkg.description || '',
      homepage: pkg.homepage || '',
      github: pkg.creator?.github || pkg.repository?.url || '',
      supabase: pkg.creator?.supabase || '',
      title: pkg.creator?.title || '',
    })
  } catch {
    return NextResponse.json({ error: 'Could not read package.json at that path' }, { status: 404 })
  }
}
