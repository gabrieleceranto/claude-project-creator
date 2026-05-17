import Link from 'next/link'
import { scanProjects } from '@/lib/workspace'
import { getEnvStatus } from '@/lib/env-config'
import { ProjectCard } from '@/components/ProjectCard'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const projects = scanProjects()
  const env = getEnvStatus()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Creator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/new"
            className="px-4 py-2 text-sm rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
          >
            + New Project
          </Link>
        </div>

        {!env.ready && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {!env.fileExists
                  ? 'Configuration file missing'
                  : `Missing keys: ${env.missing.join(', ')}`}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                New projects cannot be created until all credentials are configured.
              </p>
            </div>
            <Link
              href="/setup"
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
            >
              Set up →
            </Link>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-6">No projects yet.</p>
            <Link
              href="/new"
              className="px-4 py-2 text-sm rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
            >
              Create new
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
