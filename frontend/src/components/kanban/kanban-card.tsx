import { Project } from '@/types'
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

  const priorityBadgeColors = {
    backlog: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
    todo: 'bg-blue-500 text-white border-blue-600',
    in_progress: 'bg-yellow-500 text-white border-yellow-600',
    review: 'bg-purple-500 text-white border-purple-600',
    done: 'bg-green-500 text-white border-green-600',
  }

  // Prioridade temporária (será implementada futuramente)
  const priority = 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group cursor-grab active:cursor-grabbing rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md relative',
        statusColors[project.status],
        isDragging && 'opacity-0'
      )}
    >
      {/* Bolinha de prioridade flutuante */}
      <div className={cn(
        'absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 border-background z-10',
        priorityBadgeColors[project.status]
      )}>
        {String(priority).padStart(2, '0')}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          <div className="h-px bg-border mt-2 mb-2" />
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
