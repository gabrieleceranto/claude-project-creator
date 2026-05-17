'use client'
import { useEffect, useRef } from 'react'

function stripAnsi(s: string) {
  return s.replace(/\x1B\[[0-9;]*[mGKHFJK]/g, '')
}

interface LogStreamProps {
  logs: string[]
  running?: boolean
}

export function LogStream({ logs, running }: LogStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="h-full overflow-y-auto bg-gray-950 rounded-lg p-4 font-mono text-xs text-gray-300 leading-relaxed">
      {logs.length === 0 && (
        <span className="text-gray-500">Waiting for output…</span>
      )}
      {logs.map((line, i) => {
        const text = stripAnsi(line)
        const isHeartbeat = text.startsWith('[creator]')
        return (
          <div
            key={i}
            className={`whitespace-pre-wrap break-all ${isHeartbeat ? 'text-gray-500 italic' : ''}`}
          >
            {text || ' '}
          </div>
        )
      })}
      {running && (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-block w-[7px] h-[13px] bg-gray-400 rounded-sm"
            style={{ animation: 'blink 1.1s step-start infinite' }}
          />
        </div>
      )}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div ref={bottomRef} />
    </div>
  )
}
