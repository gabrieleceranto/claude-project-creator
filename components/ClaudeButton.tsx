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

async function pollUntilRunning(localPath: string, attempts: number, intervalMs: number): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    const isRunning = await fetchStatus(localPath)
    if (isRunning) {
      // Double-check after 2s to catch processes that crash immediately
      await new Promise((r) => setTimeout(r, 2000))
      return fetchStatus(localPath)
    }
  }
  return false
}

export function ClaudeButton({ localPath, projectName }: ClaudeButtonProps) {
  const [running, setRunning] = useState<boolean | null>(null)
  const [starting, setStarting] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus(localPath)
      .then(setRunning)
      .catch(() => setRunning(false))
  }, [localPath])

  async function start() {
    setStarting(true)
    setFailed(false)
    setError(null)
    try {
      const res = await fetch('/api/projects/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: localPath, name: projectName }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Server error ${res.status}`)
        setFailed(true)
        setRunning(false)
        return
      }
      const isRunning = await pollUntilRunning(localPath, 6, 1000)
      if (isRunning) {
        setRunning(true)
      } else {
        setFailed(true)
        setError('Process did not stay running — check tmux session for errors')
        setRunning(false)
      }
    } catch (e) {
      setFailed(true)
      setError(String(e))
      setRunning(false)
    }
    setStarting(false)
  }

  async function restart() {
    setRestarting(true)
    setFailed(false)
    setError(null)
    try {
      await fetch('/api/projects/claude', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: localPath, name: projectName }),
      })
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 500))
        const isRunning = await fetchStatus(localPath)
        if (!isRunning) break
      }
      setRunning(false)
      const res = await fetch('/api/projects/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: localPath, name: projectName }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Server error ${res.status}`)
        setFailed(true)
        return
      }
      const isRunning = await pollUntilRunning(localPath, 6, 1000)
      if (isRunning) {
        setRunning(true)
      } else {
        setFailed(true)
        setError('Process did not stay running — check tmux session for errors')
        setRunning(false)
      }
    } catch (e) {
      setFailed(true)
      setError(String(e))
      setRunning(false)
    }
    setRestarting(false)
  }

  async function stop() {
    setStopping(true)
    setFailed(false)
    setError(null)
    try {
      const res = await fetch('/api/projects/claude', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: localPath, name: projectName }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Server error ${res.status}`)
        setFailed(true)
        return
      }
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 500))
        const isRunning = await fetchStatus(localPath)
        if (!isRunning) {
          setRunning(false)
          setStopping(false)
          return
        }
      }
      setFailed(true)
      setError('Process did not stop')
    } catch (e) {
      setFailed(true)
      setError(String(e))
    }
    setStopping(false)
  }

  if (running === null) {
    return <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block animate-pulse" />
  }

  if (running) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Claude active
        </span>
        <button
          onClick={restart}
          disabled={restarting || stopping}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {restarting ? 'Restarting…' : 'Restart'}
        </button>
        <button
          onClick={stop}
          disabled={stopping || restarting}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {stopping ? 'Stopping…' : 'Stop'}
        </button>
        {failed && <span className="text-xs text-red-500">{error ?? 'Failed'}</span>}
      </div>
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
        <span className="text-xs text-red-500" title={error ?? undefined}>
          {error ?? 'Failed to start'}
        </span>
      )}
    </div>
  )
}
