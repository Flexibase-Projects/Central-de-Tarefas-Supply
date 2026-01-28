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
  isDraggedOver?: boolean
  activeDragId?: string | null
}

export function KanbanColumn({ id, title, projects, onProjectClick, isDraggedOver = false, activeDragId = null }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[280px]">
      <div className="mb-4 mt-6 shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">{projects.length} projetos</span>
      </div>
      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {/* Área de drop que cobre toda a coluna */}
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 rounded-lg border-2 border-dashed p-4 transition-colors overflow-y-auto overflow-x-hidden',
            (isOver || isDraggedOver) ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/30'
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
            {/* Espaço reservado quando arrastando para esta coluna */}
            {isDraggedOver && activeDragId && !projects.some(p => p.id === activeDragId) && (
              <div className="h-24 border-2 border-dashed border-primary rounded-lg opacity-50" />
            )}
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
