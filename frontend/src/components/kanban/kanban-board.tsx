import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Project } from '@/types'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { useState } from 'react'

const columns = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
] as const

type ColumnId = typeof columns[number]['id']

interface KanbanBoardProps {
  projects: Project[]
  onProjectMove: (projectId: string, newStatus: ColumnId) => void
  onProjectClick: (project: Project) => void
}

export function KanbanBoard({ projects, onProjectMove, onProjectClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const projectId = active.id as string
    const newStatus = over.id as ColumnId

    // Only move if status changed
    const project = projects.find(p => p.id === projectId)
    if (project && project.status !== newStatus) {
      onProjectMove(projectId, newStatus)
    }
  }

  const getProjectsByStatus = (status: ColumnId) => {
    return projects.filter(p => p.status === status)
  }

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto overflow-y-hidden">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            projects={getProjectsByStatus(column.id)}
            onProjectClick={onProjectClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeProject ? (
          <div className="rotate-3 opacity-90">
            <KanbanCard project={activeProject} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
