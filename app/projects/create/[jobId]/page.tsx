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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col flex-1">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 inline-block"
        >
          ← Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">Creating project</h1>
          {status === 'running' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 animate-pulse">
              Running
            </span>
          )}
          {status === 'done' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              Done
            </span>
          )}
          {status === 'error' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              Failed
            </span>
          )}
        </div>

        <div className="flex-1 min-h-[400px]">
          <LogStream logs={logs} />
        </div>

        {status === 'done' && result && (
          <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
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
          <div className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
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
