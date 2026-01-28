import { useState, useEffect, useCallback } from 'react'
import { ProjectTodo } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useTodos(projectId: string | null) {
  const [todos, setTodos] = useState<ProjectTodo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    if (!projectId) {
      setTodos([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const url = API_URL ? `${API_URL}/api/todos/${projectId}` : `/api/todos/${projectId}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      const data = await response.json()
      setTodos(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const createTodo = useCallback(async (todo: Partial<ProjectTodo>) => {
    try {
      const url = API_URL ? `${API_URL}/api/todos` : '/api/todos'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      })
      if (!response.ok) {
        throw new Error('Failed to create todo')
      }
      const newTodo = await response.json()
      setTodos((prev) => [...prev, newTodo])
      return newTodo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  const updateTodo = useCallback(async (id: string, updates: Partial<ProjectTodo>) => {
    try {
      const url = API_URL ? `${API_URL}/api/todos/${id}` : `/api/todos/${id}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update todo')
      }
      const updatedTodo = await response.json()
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)))
      return updatedTodo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deleteTodo = useCallback(async (id: string) => {
    try {
      const url = API_URL ? `${API_URL}/api/todos/${id}` : `/api/todos/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  const reorderTodos = useCallback(async (todoIds: string[]) => {
    if (!projectId) return

    try {
      const url = API_URL ? `${API_URL}/api/todos/reorder` : '/api/todos/reorder'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          todo_ids: todoIds,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to reorder todos')
      }
      // Refresh todos to get updated sort_order
      await fetchTodos()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [projectId, fetchTodos])

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    refreshTodos: fetchTodos,
  }
}
