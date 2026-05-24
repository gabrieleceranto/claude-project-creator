import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { WORKSPACE, patchPackageJson, scanProjects } from '@/lib/workspace'
import { readVercelToken, fetchVercelSiteUrl } from '@/lib/vercel'

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const token = readVercelToken()
  if (!token) return NextResponse.json({ error: 'VERCEL_TOKEN not configured' }, { status: 500 })

  const siteUrl = await fetchVercelSiteUrl(name, token)
  if (!siteUrl) return NextResponse.json({ error: 'Could not find Vercel URL for this project' }, { status: 404 })

  const projects = scanProjects()
  const project = projects.find(p => p.name === name)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  patchPackageJson(path.join(WORKSPACE, name), {
    title: project.title,
    siteUrl,
  })

  return NextResponse.json({ siteUrl })
}
