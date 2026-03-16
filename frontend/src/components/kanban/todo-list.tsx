import { useState } from 'react'
import * as React from 'react'
import {
  Box,
  TextField,
  IconButton,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  LinearProgress,
  Typography,
  InputAdornment,
  Chip,
  Collapse,
  Tooltip,
} from '@mui/material'
import { Trash2, GripVertical, Plus } from '@/components/ui/icons'
import { ProjectTodo } from '@/types'
import { useTodos } from '@/hooks/use-todos'
import { usePermissions } from '@/hooks/use-permissions'
import { useUsersList } from '@/hooks/use-users-list'
import { useAchievements } from '@/hooks/use-achievements'
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

// ---------------------------------------------------------------------------
// XP float animation â€” spawns a floating "+N XP" label at the click position
// ---------------------------------------------------------------------------
function formatXp(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function triggerXpFloat(xp: number, event: React.MouseEvent | null) {
  const el = document.createElement('div')
  el.className = 'xp-float-anim'
  el.textContent = `+${formatXp(xp)} XP`
  el.style.left = event ? `${event.clientX - 20}px` : '50%'
  el.style.top = event ? `${event.clientY - 10}px` : '50%'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1500)
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
interface TodoListProps {
  projectId: string
  highlightedTodoId?: string | null
}

interface TodoItemProps {
  todo: ProjectTodo
  onToggle: (id: string, completed: boolean, event: React.MouseEvent) => void
  onDelete: (id: string) => void
  onAssign: (id: string, userId: string | null) => void
  assignedUserName?: string | null
  users: Array<{ id: string; name: string }>
  isHighlighted?: boolean
  canManage: boolean
}

// ---------------------------------------------------------------------------
// TodoItem
// ---------------------------------------------------------------------------
function TodoItem({ todo, onToggle, onDelete, onAssign, users, isHighlighted, canManage }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !canManage })

  const itemRef = React.useRef<HTMLDivElement>(null)
  const [shouldHighlight, setShouldHighlight] = React.useState(false)

  React.useEffect(() => {
    if (isHighlighted && itemRef.current) {
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      setShouldHighlight(true)
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

  // Deadline chip logic
  const deadlineChip = todo.deadline
    ? (() => {
        const isOverdue = new Date(todo.deadline) < new Date() && !todo.completed
        return (
          <Chip
            size="small"
            label={new Date(todo.deadline).toLocaleDateString('pt-BR')}
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              bgcolor: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              color: isOverdue ? '#EF4444' : '#F59E0B',
              border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )
      })()
    : null

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
      {canManage && (
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', '&:active': { cursor: 'grabbing' } }}>
          <GripVertical size={18} />
        </Box>
      )}

      <Checkbox
        size="small"
        checked={todo.completed}
        onChange={(e, _checked) => {
          // Synthesise a MouseEvent-like object from the native event
          const nativeEvent = e.nativeEvent as MouseEvent
          const syntheticEvent = {
            clientX: nativeEvent.clientX,
            clientY: nativeEvent.clientY,
          } as React.MouseEvent
          onToggle(todo.id, e.target.checked, syntheticEvent)
        }}
      />

      {/* Title + metadata chips */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ ...(todo.completed && { textDecoration: 'line-through', color: 'text.secondary' }) }}
        >
          {todo.title}
        </Typography>

        {/* Metadata chips row */}
        {(todo.xp_reward || todo.deadline || todo.achievement_id) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {/* XP chip */}
            {todo.xp_reward && todo.xp_reward > 0 && (
              <Chip
                size="small"
                label={`+${formatXp(todo.xp_reward)} XP`}
                sx={{
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: 'rgba(124,58,237,0.1)',
                  color: '#7C3AED',
                  border: '1px solid rgba(124,58,237,0.2)',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}

            {/* Deadline chip */}
            {deadlineChip}

            {/* Achievement chip */}
            {todo.achievement_id && (
              <Tooltip title="Tem conquista vinculada" arrow>
                <Chip
                  size="small"
                  label="ðŸ†"
                  sx={{
                    height: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: 'rgba(245,158,11,0.1)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245,158,11,0.3)',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <FormControl size="small" sx={{ minWidth: 140 }} disabled={todo.completed || !canManage}>
        <Select
          value={todo.assigned_to || ''}
          onChange={(e) => onAssign(todo.id, e.target.value || null)}
          displayEmpty
          sx={{ fontSize: 12, height: 28 }}
        >
          <MenuItem value="">Sem responsÃ¡vel</MenuItem>
          {users.length === 0 ? (
            <MenuItem disabled>Carregando usuÃ¡rios...</MenuItem>
          ) : (
            users.map((user) => (
              <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {canManage && (
        <IconButton className="delete-btn" size="small" onClick={() => onDelete(todo.id)} sx={{ opacity: 0 }}>
          <Trash2 size={16} />
        </IconButton>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// TodoList
// ---------------------------------------------------------------------------
export function TodoList({ projectId, highlightedTodoId }: TodoListProps) {
  const { todos, loading, createTodo, updateTodo, deleteTodo, reorderTodos } =
    useTodos(projectId)
  const { hasRole } = usePermissions()
  const { users, error: usersError } = useUsersList()
  const { achievements } = useAchievements()
  const isAdmin = hasRole('admin')
  const canCreateTodo = isAdmin

  // Basic creation state
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // Advanced creation state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newTodoXp, setNewTodoXp] = useState(1)
  const [newTodoDeadline, setNewTodoDeadline] = useState('')
  const [newTodoDeadlineBonusPercent, setNewTodoDeadlineBonusPercent] = useState(0)
  const [newTodoAchievementId, setNewTodoAchievementId] = useState<string | null>(null)
  const linkedAchievements = achievements.filter(
    (a) => (a.mode ?? 'global_auto') === 'linked_item'
  )

  if (usersError) {
    console.error('Erro ao carregar usuÃ¡rios:', usersError)
  }

  // Progress
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
        xp_reward: newTodoXp,
        deadline: newTodoDeadline || undefined,
        deadline_bonus_percent: newTodoDeadlineBonusPercent,
        achievement_id: newTodoAchievementId || undefined,
      })
      setNewTodoTitle('')
      setNewTodoXp(1)
      setNewTodoDeadline('')
      setNewTodoDeadlineBonusPercent(0)
      setNewTodoAchievementId(null)
      setShowAdvanced(false)
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

  const handleToggle = async (id: string, completed: boolean, event: React.MouseEvent) => {
    try {
      // Trigger XP float when completing (not un-completing)
      if (completed) {
        const todo = todos.find((t) => t.id === id)
        const xp = todo?.xp_reward
        if (xp && xp > 0) {
          triggerXpFloat(xp, event)
        }
      }
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
            {completedCount} de {totalCount} concluÃ­dos
          </Typography>
        </Box>
      )}

            {isAdmin ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCreateTodo()
                }
              }}
              placeholder="Adicionar novo item..."
              disabled={!canCreateTodo}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Opcoes avancadas" arrow>
                      <IconButton
                        size="small"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        disabled={!canCreateTodo}
                        sx={{
                          color: showAdvanced ? 'primary.main' : 'text.secondary',
                          mr: 0.5,
                        }}
                      >
                        <Typography sx={{ fontSize: 14, lineHeight: 1 }}>⚙</Typography>
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={handleCreateTodo}
                      disabled={!canCreateTodo || !newTodoTitle.trim()}
                    >
                      <Plus size={24} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Collapse in={showAdvanced}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                flexWrap: 'wrap',
                px: 1,
                py: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TextField
                label="XP Base"
                type="number"
                size="small"
                value={newTodoXp}
                onChange={(e) =>
                  setNewTodoXp(Math.max(0.01, Math.min(500, Number(e.target.value))))
                }
                inputProps={{ min: 0.01, max: 500, step: 0.01 }}
                sx={{ width: 100 }}
              />

              <TextField
                label="Prazo"
                type="date"
                size="small"
                value={newTodoDeadline}
                onChange={(e) => setNewTodoDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />

              <TextField
                label="% Bonus Prazo"
                type="number"
                size="small"
                value={newTodoDeadlineBonusPercent}
                onChange={(e) =>
                  setNewTodoDeadlineBonusPercent(Math.max(0, Math.min(500, Number(e.target.value))))
                }
                inputProps={{ min: 0, max: 500, step: 0.01 }}
                sx={{ width: 130 }}
              />

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <Select
                  value={newTodoAchievementId ?? ''}
                  onChange={(e) => setNewTodoAchievementId(e.target.value || null)}
                  displayEmpty
                >
                  <MenuItem value="">Sem conquista vinculada</MenuItem>
                  {linkedAchievements.map((achievement) => (
                    <MenuItem key={achievement.id} value={achievement.id}>
                      {achievement.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Collapse>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Apenas administradores podem criar e configurar to-dos.
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
          Nenhum item na lista. Adicione um novo item acima.
        </Typography>
      ) : isAdmin ? (
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
                    canManage={isAdmin}
                  />
                )
              })}
            </Box>
          </SortableContext>
        </DndContext>
      ) : (
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
                canManage={false}
              />
            )
          })}
        </Box>
      )}
    </Box>
  )
}

