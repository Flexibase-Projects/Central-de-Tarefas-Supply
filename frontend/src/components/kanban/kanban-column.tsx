import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Project } from '@/types'
import { KanbanCard } from './kanban-card'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: string
  title: string
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function KanbanColumn({ id, title, projects, onProjectClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[280px]">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">{projects.length} projetos</span>
      </div>
      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 rounded-lg border-2 border-dashed p-4 transition-colors overflow-y-auto overflow-x-hidden',
            isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
          )}
        >
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <KanbanCard
                key={project.id}
                project={project}
                onClick={() => onProjectClick(project)}
              />
            ))}
            {projects.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Arraste projetos aqui
              </div>
            )}
          </div>
        </div>
      </SortableContext>
    </div>
  )
}
