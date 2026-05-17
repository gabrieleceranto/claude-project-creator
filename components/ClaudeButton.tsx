'use client'
import { useState, useEffect } from 'react'

interface ClaudeButtonProps {
  localPath: string
  projectName: string
}

async function fetchStatus(localPath: string): Promise<boolean> {
  const res = await fetch(`/api/projects/claude?path=${encodeURIComponent(localPath)}`)
  const d = await res.json()
  return d.running as boolean
}

export function ClaudeButton({ localPath, projectName }: ClaudeButtonProps) {
  const [running, setRunning] = useState<boolean | null>(null)
  const [starting, setStarting] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetchStatus(localPath)
      .then(setRunning)
      .catch(() => setRunning(false))
  }, [localPath])

  async function start() {
    setStarting(true)
    setFailed(false)
    try {
      await fetch('/api/projects/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: localPath, name: projectName }),
      })
      // Poll up to 5s for the process to appear
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        const isRunning = await fetchStatus(localPath)
        if (isRunning) {
          setRunning(true)
          setStarting(false)
          return
        }
      }
      setFailed(true)
      setRunning(false)
    } catch {
      setFailed(true)
      setRunning(false)
    }
    setStarting(false)
  }

  if (running === null) {
    return <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block animate-pulse" />
  }

  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Claude active
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={start}
        disabled={starting}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" />
        {starting ? 'Starting…' : 'Open Claude'}
      </button>
      {failed && (
        <span className="text-xs text-red-500">Failed to start</span>
      )}
    </div>
  )
}
