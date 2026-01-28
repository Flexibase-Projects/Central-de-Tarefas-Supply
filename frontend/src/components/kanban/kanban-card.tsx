import { Project } from '@/types'
import { ExternalLink, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
  project: Project
  onClick?: () => void
}

export function KanbanCard({ project, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const statusColors = {
    backlog: 'bg-muted/50 border-border',
    todo: 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800',
    in_progress: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800',
    review: 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800',
    done: 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md',
        statusColors[project.status],
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </div>
      
      {project.github_url && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Ver repositório
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}
