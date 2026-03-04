import { useState } from 'react'
import * as React from 'react'
import { Box, TextField, IconButton, Checkbox, FormControl, Select, MenuItem, LinearProgress, Typography, InputAdornment } from '@mui/material'
import { Delete, DragIndicator, Add, } from '@mui/icons-material'
import { ProjectTodo } from '@/types'
import { useTodos } from '@/hooks/use-todos'
import { usePermissions } from '@/hooks/use-permissions'
import { useUsersList } from '@/hooks/use-users-list'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { CircularProgress } from '@mui/material'
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

interface TodoListProps {
  projectId: string
  highlightedTodoId?: string | null
}

interface TodoItemProps {
  todo: ProjectTodo
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onAssign: (id: string, userId: string | null) => void
  assignedUserName?: string | null
  users: Array<{ id: string; name: string }>
  isHighlighted?: boolean
}

function TodoItem({ todo, onToggle, onDelete, onAssign, users, isHighlighted }: TodoItemProps) {
  // assignedUserName kept in interface for API but not rendered in this view
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const itemRef = React.useRef<HTMLDivElement>(null)
  const [shouldHighlight, setShouldHighlight] = React.useState(false)

  // Scroll para o item destacado quando ele aparecer e iniciar animação
  React.useEffect(() => {
    if (isHighlighted && itemRef.current) {
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      setShouldHighlight(true)
      // Remover destaque após animação (3 piscadas de 0.5s cada = 1.5s)
      const timer = setTimeout(() => {
        setShouldHighlight(false)
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setShouldHighlight(false)
    }
  }, [isHighlighted])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Box
      ref={(node: HTMLDivElement | null) => {
        setNodeRef(node as HTMLElement | null)
        ;(itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      component="div"
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        width: '100%',
        transition: 'all 0.2s',
        ...(shouldHighlight
          ? { bgcolor: 'warning.light', border: 2, borderColor: 'warning.main', boxShadow: 2 }
          : { '&:hover': { bgcolor: 'action.hover' }, '&:hover .delete-btn': { opacity: 1 } }),
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', '&:active': { cursor: 'grabbing' } }}>
        <DragIndicator sx={{ fontSize: 18 }} />
      </Box>
      <Checkbox size="small" checked={todo.completed} onChange={(e) => onToggle(todo.id, e.target.checked)} />
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, ...(todo.completed && { textDecoration: 'line-through', color: 'text.secondary' }) }}>
        {todo.title}
      </Typography>
      <FormControl size="small" sx={{ minWidth: 140 }} disabled={todo.completed}>
        <Select
          value={todo.assigned_to || ''}
          onChange={(e) => onAssign(todo.id, e.target.value || null)}
          displayEmpty
          sx={{ fontSize: 12, height: 28 }}
        >
          <MenuItem value="">Sem responsável</MenuItem>
          {users.length === 0 ? (
            <MenuItem disabled>Carregando usuários...</MenuItem>
          ) : (
            users.map((user) => (
              <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      <IconButton className="delete-btn" size="small" onClick={() => onDelete(todo.id)} sx={{ opacity: 0 }}>
        <Delete sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}

export function TodoList({ projectId, highlightedTodoId }: TodoListProps) {
  const { todos, loading, createTodo, updateTodo, deleteTodo, reorderTodos } =
    useTodos(projectId)
  const { hasPermission } = usePermissions()
  const { users, error: usersError } = useUsersList()
  const canCreateTodo = hasPermission('create_todo')
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // Debug: verificar se usuários estão sendo carregados
  if (usersError) {
    console.error('Erro ao carregar usuários:', usersError)
  }

  // Calculate progress percentage
  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((todo) => todo.id === active.id)
      const newIndex = todos.findIndex((todo) => todo.id === over.id)

      const newTodos = arrayMove(todos, oldIndex, newIndex)
      const todoIds = newTodos.map((todo) => todo.id)

      // Optimistic update
      try {
        await reorderTodos(todoIds)
      } catch (error) {
        console.error('Error reordering todos:', error)
      }
    }
  }

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) return

    try {
      await createTodo({
        project_id: projectId,
        title: newTodoTitle.trim(),
      })
      setNewTodoTitle('')
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleAssign = async (todoId: string, userId: string | null) => {
    try {
      await updateTodo(todoId, { assigned_to: userId })
    } catch (error) {
      console.error('Error assigning todo:', error)
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed })
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {totalCount > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Progresso</Typography>
            <Typography variant="caption" fontWeight={500}>{progressPercentage}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 8, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 0.5 }}>
            {completedCount} de {totalCount} concluídos
          </Typography>
        </Box>
      )}

      <RequirePermission permission="create_todo">
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateTodo(); } }}
            placeholder="Adicionar novo item..."
            disabled={!canCreateTodo}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleCreateTodo} disabled={!canCreateTodo || !newTodoTitle.trim()}>
                    <Add />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </RequirePermission>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
          Nenhum item na lista. Adicione um novo item acima.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {todos.map((todo) => {
                const assignedUser = users.find((u) => u.id === todo.assigned_to)
                return (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                    assignedUserName={assignedUser?.name || null}
                    users={users}
                    isHighlighted={highlightedTodoId === todo.id}
                  />
                )
              })}
            </Box>
          </SortableContext>
        </DndContext>
      )}
    </Box>
  )
}
