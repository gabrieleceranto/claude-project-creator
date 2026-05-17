'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { LogStream } from '@/components/LogStream'

interface DoneResult {
  vercelUrl: string
  githubUrl: string
  supabaseUrl: string
  localPath: string
}

export default function CreateProgressPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running')
  const [result, setResult] = useState<DoneResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => {
      setLogs((prev) => [
        ...prev,
        '[creator] ⏱  Still running — checking again in 1 minute…',
      ])
    }, 60_000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    const source = new EventSource(`/api/projects/${jobId}/stream`)

    source.onmessage = (e) => {
      const { log } = JSON.parse(e.data)
      setLogs((prev) => [...prev, log])
    }

    source.addEventListener('done', (e: Event) => {
      const data = JSON.parse((e as MessageEvent).data)
      setResult(data)
      setStatus('done')
      source.close()
    })

    source.addEventListener('error', (e: Event) => {
      const raw = (e as MessageEvent).data
      if (raw) {
        const data = JSON.parse(raw)
        setErrorMsg(data.error || 'Unknown error')
        setStatus('error')
        source.close()
      }
    })

    return () => source.close()
  }, [jobId])

  return (
    <main className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Fixed header — always visible */}
      <div className="shrink-0 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto w-full">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3 inline-block"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Creating project</h1>
            {status === 'running' && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Running
              </span>
            )}
            {status === 'done' && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Done
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Failed
              </span>
            )}
          </div>
          {status === 'running' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Setting up GitHub, Supabase, Vercel and scaffolding your app…
            </p>
          )}
        </div>
      </div>

      {/* Log area — fills remaining space, scrolls internally */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full px-6 py-4">
        <div className="flex-1 overflow-hidden">
          <LogStream logs={logs} running={status === 'running'} />
        </div>

        {status === 'done' && result && (
          <div className="shrink-0 mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
              Project created successfully!
            </p>
            <div className="flex flex-wrap gap-3">
              {result.vercelUrl && (
                <a
                  href={result.vercelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Vercel →
                </a>
              )}
              {result.githubUrl && (
                <a
                  href={result.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  GitHub →
                </a>
              )}
              {result.supabaseUrl && (
                <a
                  href={result.supabaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Supabase →
                </a>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="shrink-0 mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
            <p className="font-semibold text-red-800 dark:text-red-300 mb-1">Creation failed</p>
            {errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}
            <Link
              href="/new"
              className="inline-block mt-3 text-sm text-gray-700 dark:text-gray-300 underline underline-offset-2"
            >
              Try again
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
