import fs from 'fs'
import path from 'path'
import os from 'os'

export const WORKSPACE = path.join(os.homedir(), 'workspace')

export interface Project {
  id: string
  name: string
  title: string
  description: string
  vercelUrl: string
  githubUrl: string
  supabaseUrl: string
  localPath: string
  createdAt: string
}

export function scanProjects(): Project[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(WORKSPACE, { withFileTypes: true })
  } catch {
    return []
  }

  const projects: Project[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const pkgPath = path.join(WORKSPACE, entry.name, 'package.json')
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      if (!pkg.creator) continue
      projects.push({
        id: pkg.name || entry.name,
        name: pkg.name || entry.name,
        title: pkg.creator.title || pkg.name || entry.name,
        description: pkg.description || '',
        vercelUrl: pkg.homepage || '',
        githubUrl: pkg.creator.github || '',
        supabaseUrl: pkg.creator.supabase || '',
        localPath: path.join(WORKSPACE, entry.name),
        createdAt: pkg.creator.createdAt || '',
      })
    } catch {
      // no valid package.json or no creator field — skip
    }
  }

  return projects.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
}

export function patchPackageJson(
  localPath: string,
  fields: {
    title: string
    description?: string
    vercelUrl?: string
    githubUrl?: string
    supabaseUrl?: string
    createdAt?: string
  }
): void {
  const pkgPath = path.join(localPath, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (fields.description !== undefined) pkg.description = fields.description
  if (fields.vercelUrl) pkg.homepage = fields.vercelUrl
  pkg.creator = {
    title: fields.title,
    github: fields.githubUrl || pkg.creator?.github || '',
    supabase: fields.supabaseUrl || pkg.creator?.supabase || '',
    createdAt: fields.createdAt || pkg.creator?.createdAt || new Date().toISOString(),
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}
