import { useState, useCallback } from 'react'
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material'
import { GripVertical } from '@/components/ui/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/contexts/AuthContext'
import type { Project } from '@/types'

const STATUS_LABELS: Record<Project['status'], string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  in_progress: 'Em progresso',
  review: 'Revisão',
  done: 'Concluído',
}

function SortableProjectCard({ project, index, canDrag }: { project: Project; index: number; canDrag: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: project.id, disabled: !canDrag })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        opacity: isDragging ? 0.6 : 1,
        cursor: canDrag ? 'grab' : 'default',
        border: '1px solid',
        borderColor: 'divider',
        ...(canDrag && { '&:active': { cursor: 'grabbing' } }),
        '&:hover': { bgcolor: 'action.hover' },
        willChange: isDragging ? 'transform' : undefined,
      }}
    >
      {canDrag && (
        <Box
          {...attributes}
          {...listeners}
          sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}
        >
          <GripVertical size={20} />
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
        {index + 1}.
      </Typography>
      <Typography variant="body1" fontWeight={500} sx={{ flex: 1, minWidth: 0 }} noWrap>
        {project.name}
      </Typography>
      <Chip
        size="small"
        label={STATUS_LABELS[project.status]}
        sx={{ fontWeight: 500, flexShrink: 0 }}
      />
    </Paper>
  )
}

export default function Prioridades() {
  const { projects, loading, error, updatePriorityOrder } = useProjects()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const [savingOrder, setSavingOrder] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = projects.findIndex((p) => p.id === active.id)
      const newIndex = projects.findIndex((p) => p.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(projects, oldIndex, newIndex)
      const orderedIds = reordered.map((p) => p.id)
      setSavingOrder(true)
      try {
        await updatePriorityOrder(orderedIds)
      } finally {
        setSavingOrder(false)
      }
    },
    [projects, updatePriorityOrder]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Prioridades
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {isAdmin
            ? 'Arraste os cards para ordenar: o item no topo é o mais importante. A ordem é salva automaticamente.'
            : 'Prioridades dos projetos definidas pelo administrador.'}
        </Typography>
        {savingOrder && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Salvando ordem...
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, pb: 2 }}>
        {projects.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography color="text.secondary">
              Nenhum desenvolvimento cadastrado. Crie projetos em Desenvolvimentos para listá-los aqui.
            </Typography>
          </Paper>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {projects.map((project, index) => (
                  <SortableProjectCard key={project.id} project={project} index={index} canDrag={isAdmin} />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        )}
      </Box>
    </Box>
  )
}
