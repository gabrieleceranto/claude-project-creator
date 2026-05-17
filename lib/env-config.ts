import fs from 'fs'
import os from 'os'
import path from 'path'

export const ENV_FILE = path.join(os.homedir(), '.new-webapp-project.env')

export const REQUIRED_KEYS = [
  'GITHUB_USER',
  'VERCEL_TOKEN',
  'SUPABASE_ORG_ID',
  'SUPABASE_ACCESS_TOKEN',
] as const

export const OPTIONAL_KEYS = ['SUPABASE_REGION'] as const

export type RequiredKey = (typeof REQUIRED_KEYS)[number]

export interface EnvStatus {
  fileExists: boolean
  missing: RequiredKey[]
  populated: RequiredKey[]
  /** Only non-secret values are returned */
  values: { GITHUB_USER?: string; SUPABASE_REGION?: string }
  /** True when all required keys are set */
  ready: boolean
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return result
}

export function getEnvStatus(): EnvStatus {
  if (!fs.existsSync(ENV_FILE)) {
    return {
      fileExists: false,
      missing: [...REQUIRED_KEYS],
      populated: [],
      values: {},
      ready: false,
    }
  }

  const parsed = parseEnvFile(fs.readFileSync(ENV_FILE, 'utf-8'))
  const missing: RequiredKey[] = []
  const populated: RequiredKey[] = []

  for (const key of REQUIRED_KEYS) {
    if (parsed[key]) populated.push(key)
    else missing.push(key)
  }

  return {
    fileExists: true,
    missing,
    populated,
    values: {
      GITHUB_USER: parsed['GITHUB_USER'],
      SUPABASE_REGION: parsed['SUPABASE_REGION'] || 'eu-west-1',
    },
    ready: missing.length === 0,
  }
}

export function writeEnvFile(fields: Record<string, string>): void {
  let existing: Record<string, string> = {}
  if (fs.existsSync(ENV_FILE)) {
    existing = parseEnvFile(fs.readFileSync(ENV_FILE, 'utf-8'))
  }

  const all = [...REQUIRED_KEYS, ...OPTIONAL_KEYS]
  const merged = { ...existing, ...fields }

  const lines = [
    '# new-webapp-project configuration',
    `# Updated by Creator dashboard on ${new Date().toISOString()}`,
    '# Do NOT commit this file — it contains secrets.',
    '',
    ...all
      .filter((k) => merged[k])
      .map((k) => `${k}=${merged[k]}`),
  ]

  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n', { mode: 0o600 })
}
