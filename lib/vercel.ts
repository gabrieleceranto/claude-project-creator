import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Project } from './workspace'

export function readVercelToken(): string {
  const envPath = path.join(os.homedir(), '.new-webapp-project.env')
  try {
    const line = fs.readFileSync(envPath, 'utf-8')
      .split('\n')
      .find(l => l.startsWith('VERCEL_TOKEN='))
    return line ? line.split('=').slice(1).join('=').trim() : ''
  } catch {
    return ''
  }
}

interface VercelProject {
  alias?: Array<{ domain: string }>
  targets?: {
    production?: { alias?: string[] }
  }
}

export async function fetchVercelSiteUrl(projectName: string, token: string): Promise<string> {
  try {
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json() as VercelProject

    // Production deployment aliases are the most reliable source
    const prodAlias = data.targets?.production?.alias?.find(d => d.endsWith('.vercel.app'))
    if (prodAlias) return `https://${prodAlias}`

    // Fall back to project-level aliases
    const projectAlias = (data.alias ?? []).map(a => a.domain).find(d => d.endsWith('.vercel.app'))
    if (projectAlias) return `https://${projectAlias}`

    return ''
  } catch {
    return ''
  }
}

// Fetches and stores the real Vercel URL for any project that is missing one.
// Mutates package.json on disk and returns the updated project list.
export async function resolveProjectUrls(projects: Project[]): Promise<Project[]> {
  const token = readVercelToken()
  if (!token) return projects

  const { patchPackageJson } = await import('./workspace')

  return Promise.all(
    projects.map(async (project) => {
      if (project.siteUrl || !project.vercelUrl) return project
      const siteUrl = await fetchVercelSiteUrl(project.name, token)
      if (!siteUrl) return project
      try {
        patchPackageJson(project.localPath, { title: project.title, siteUrl })
      } catch {
        // non-fatal
      }
      return { ...project, siteUrl }
    })
  )
}
