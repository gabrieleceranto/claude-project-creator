import { NextResponse } from 'next/server'
import { scanProjects } from '@/lib/workspace'

export function GET() {
  const projects = scanProjects()
  return NextResponse.json(projects)
}
