'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ImportPage() {
  const router = useRouter()
  const [localPath, setLocalPath] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [vercelUrl, setVercelUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function detect() {
    if (!localPath.trim()) return
    setDetecting(true)
    setDetectError('')
    try {
      const res = await fetch(`/api/projects/detect?path=${encodeURIComponent(localPath.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setDetectError(data.error || 'Could not detect')
      } else {
        if (data.github) setGithubUrl(data.github)
        if (data.supabase) setSupabaseUrl(data.supabase)
        if (data.homepage) setVercelUrl(data.homepage)
        if (data.description && !description) setDescription(data.description)
        if (data.title && !title) setTitle(data.title)
      }
    } catch {
      setDetectError('Network error')
    }
    setDetecting(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!localPath.trim() || !title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localPath: localPath.trim(),
          title: title.trim(),
          description: description.trim(),
          vercelUrl: vercelUrl.trim(),
          githubUrl: githubUrl.trim(),
          supabaseUrl: supabaseUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }
      router.push('/')
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="max-w-lg mx-auto w-full px-6 py-10">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-8 inline-block"
        >
          ← Dashboard
        </Link>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Import project</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Local path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/home/gabriele/workspace/my-project"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-400"
                required
              />
              <button
                type="button"
                onClick={detect}
                disabled={detecting || !localPath.trim()}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                {detecting ? '…' : 'Detect'}
              </button>
            </div>
            {detectError && <p className="text-xs text-red-500 mt-1">{detectError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Project"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vercel URL
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="url"
              value={vercelUrl}
              onChange={(e) => setVercelUrl(e.target.value)}
              placeholder="https://my-project.vercel.app"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GitHub URL
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supabase URL
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://ref.supabase.co"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !localPath.trim() || !title.trim()}
            className="px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing…' : 'Import project'}
          </button>
        </form>
      </div>
    </main>
  )
}
