'use client'
import { useEffect, useRef } from 'react'

// Strip ANSI escape codes for display
function stripAnsi(s: string) {
  return s.replace(/\x1B\[[0-9;]*[mGKHFJK]/g, '')
}

interface LogStreamProps {
  logs: string[]
}

export function LogStream({ logs }: LogStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="h-full overflow-y-auto bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 leading-relaxed">
      {logs.length === 0 && (
        <span className="text-gray-500">Waiting for output…</span>
      )}
      {logs.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap break-all">
          {stripAnsi(line) || ' '}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
