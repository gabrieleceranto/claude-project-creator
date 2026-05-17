export type JobStatus = 'running' | 'done' | 'error'

export interface JobResult {
  vercelUrl: string
  githubUrl: string
  supabaseUrl: string
  localPath: string
}

export interface Job {
  id: string
  status: JobStatus
  logs: string[]
  result?: JobResult
  error?: string
  listeners: Array<(line: string) => void>
}

// Survive hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __creatorJobs: Map<string, Job> | undefined
}
const jobs: Map<string, Job> = globalThis.__creatorJobs ?? new Map()
globalThis.__creatorJobs = jobs

export function createJob(id: string): Job {
  const job: Job = { id, status: 'running', logs: [], listeners: [] }
  jobs.set(id, job)
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function appendLog(id: string, line: string): void {
  const job = jobs.get(id)
  if (!job) return
  job.logs.push(line)
  for (const fn of job.listeners) fn(line)
}

export function finishJob(id: string, result: JobResult): void {
  const job = jobs.get(id)
  if (!job) return
  job.status = 'done'
  job.result = result
  for (const fn of [...job.listeners]) fn('__DONE__')
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id)
  if (!job) return
  job.status = 'error'
  job.error = error
  for (const fn of [...job.listeners]) fn('__ERROR__')
}

export function addListener(id: string, fn: (line: string) => void): () => void {
  const job = jobs.get(id)
  if (!job) return () => {}
  job.listeners.push(fn)
  return () => {
    job.listeners = job.listeners.filter((l) => l !== fn)
  }
}
