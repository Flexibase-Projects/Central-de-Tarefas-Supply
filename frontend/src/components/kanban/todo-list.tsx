import { useState } from 'react'
import { ProjectTodo } from '@/types'
import { useTodos } from '@/hooks/use-todos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Plus, Loader2 } from 'lucide-react'
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
}

interface TodoItemProps {
  todo: ProjectTodo
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
      <span
        className={`flex-1 text-sm ${
          todo.completed
            ? 'line-through text-muted-foreground'
            : 'text-foreground'
        }`}
      >
        {todo.title}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(todo.id)}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function TodoList({ projectId }: TodoListProps) {
  const { todos, loading, createTodo, updateTodo, deleteTodo, reorderTodos } =
    useTodos(projectId)
  const [newTodoTitle, setNewTodoTitle] = useState('')

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
    <div className="space-y-3">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {completedCount} de {totalCount} concluídos
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCreateTodo()
            }
          }}
          placeholder="Adicionar novo item..."
          className="flex-1"
        />
        <Button onClick={handleCreateTodo} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : todos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum item na lista. Adicione um novo item acima.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map((todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
