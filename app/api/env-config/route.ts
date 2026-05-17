import { NextRequest, NextResponse } from 'next/server'
import { getEnvStatus, writeEnvFile, REQUIRED_KEYS, OPTIONAL_KEYS } from '@/lib/env-config'

export function GET() {
  return NextResponse.json(getEnvStatus())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const allowed = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS])
  const fields: Record<string, string> = {}

  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k as never) && typeof v === 'string' && v.trim()) {
      fields[k] = v.trim()
    }
  }

  try {
    writeEnvFile(fields)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
