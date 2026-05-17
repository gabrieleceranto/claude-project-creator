import { Project } from '@/lib/workspace'
import { ClaudeButton } from './ClaudeButton'

function ExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

interface LinkBadgeProps {
  href: string
  label: string
  colorClass: string
}

function LinkBadge({ href, label, colorClass }: LinkBadgeProps) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80 ${colorClass}`}
    >
      {label}
      <ExternalIcon />
    </a>
  )
}

export function ProjectCard({ project }: { project: Project }) {
  const date = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-50 text-base leading-tight">
            {project.title}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{project.name}</p>
        </div>
        {date && (
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{date}</span>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        <LinkBadge
          href={project.vercelUrl}
          label="Vercel"
          colorClass="bg-black text-white dark:bg-white dark:text-black"
        />
        <LinkBadge
          href={project.githubUrl}
          label="GitHub"
          colorClass="bg-gray-800 text-white dark:bg-gray-700"
        />
        <LinkBadge
          href={project.supabaseUrl}
          label="Supabase"
          colorClass="bg-emerald-600 text-white"
        />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
        <ClaudeButton localPath={project.localPath} projectName={project.name} />
      </div>
    </div>
  )
}
