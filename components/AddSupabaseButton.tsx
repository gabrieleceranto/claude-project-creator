'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddSupabaseButton({ projectName }: { projectName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      })
      const { jobId, error } = await res.json()
      if (error) throw new Error(error)
      router.push(`/projects/create/${jobId}?label=Adding+Supabase`)
    } catch (e) {
      alert(`Failed to start: ${e}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
    >
      {loading ? 'Starting…' : '+ Supabase'}
    </button>
  )
}
