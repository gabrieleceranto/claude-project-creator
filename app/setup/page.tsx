'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FieldConfig {
  key: string
  label: string
  description: string
  helpUrl?: string
  helpText?: string
  secret: boolean
  optional?: boolean
  placeholder?: string
}

const FIELDS: FieldConfig[] = [
  {
    key: 'GITHUB_USER',
    label: 'GitHub username',
    description: 'Your GitHub username',
    secret: false,
    placeholder: 'your-github-user',
  },
  {
    key: 'VERCEL_TOKEN',
    label: 'Vercel token',
    description: 'Personal access token for the Vercel API',
    helpUrl: 'https://vercel.com/account/tokens',
    helpText: 'vercel.com/account/tokens',
    secret: true,
  },
  {
    key: 'SUPABASE_ORG_ID',
    label: 'Supabase org ID',
    description: 'Found in your org settings',
    helpUrl: 'https://app.supabase.com/org',
    helpText: 'app.supabase.com/org → Settings → General',
    secret: false,
    placeholder: 'abcdefghijklmnop',
  },
  {
    key: 'SUPABASE_ACCESS_TOKEN',
    label: 'Supabase access token',
    description: 'Personal access token for the Supabase API',
    helpUrl: 'https://app.supabase.com/account/tokens',
    helpText: 'app.supabase.com/account/tokens',
    secret: true,
  },
  {
    key: 'SUPABASE_REGION',
    label: 'Supabase region',
    description: 'Region for new Supabase projects',
    secret: false,
    optional: true,
    placeholder: 'eu-west-1',
  },
]

export default function SetupPage() {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({})
  const [populated, setPopulated] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/env-config')
      .then((r) => r.json())
      .then((d) => {
        setPopulated(d.populated ?? [])
        // Pre-fill non-secret visible values
        setValues({
          GITHUB_USER: d.values?.GITHUB_USER ?? '',
          SUPABASE_REGION: d.values?.SUPABASE_REGION ?? 'eu-west-1',
        })
      })
      .catch(() => {})
  }, [])

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/env-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || 'Failed to save')
      } else {
        setSaved(true)
        // Refresh populated state
        const status = await fetch('/api/env-config').then((r) => r.json())
        setPopulated(status.populated ?? [])
        if (status.ready) {
          setTimeout(() => router.push('/'), 1000)
        }
      }
    } catch {
      setError('Network error')
    }

    setSaving(false)
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

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          Environment setup
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Saved to <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">~/.new-webapp-project.env</code> (chmod 600, never committed)
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {FIELDS.map((field) => {
            const isSet = populated.includes(field.key)
            const val = values[field.key] ?? ''

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                    {field.optional && (
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    )}
                  </label>
                  {isSet && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Set
                    </span>
                  )}
                </div>

                <input
                  type={field.secret ? 'password' : 'text'}
                  value={val}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={
                    field.secret && isSet
                      ? 'Leave blank to keep existing value'
                      : (field.placeholder ?? '')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder:font-sans placeholder:text-gray-400"
                />

                {field.helpUrl && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Get it at{' '}
                    <a
                      href={field.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {field.helpText ?? field.helpUrl}
                    </a>
                  </p>
                )}
              </div>
            )
          })}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {saved && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
              Saved successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </main>
  )
}
