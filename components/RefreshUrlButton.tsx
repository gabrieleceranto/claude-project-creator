'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RefreshUrlButton({ projectName }: { projectName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects/refresh-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      router.refresh()
    } catch (err) {
      alert(`Could not refresh URL: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Sync website URL from Vercel"
      className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
    >
      <svg
        className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  )
}
