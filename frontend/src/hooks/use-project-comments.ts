import { useState, useEffect, useCallback } from 'react'
import { Comment } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useProjectComments(projectId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    if (!projectId) {
      setComments([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const url = API_URL ? `${API_URL}/api/project-comments/${projectId}` : `/api/project-comments/${projectId}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setComments(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const createComment = useCallback(async (comment: Partial<Comment>) => {
    try {
      const url = API_URL ? `${API_URL}/api/project-comments` : '/api/project-comments'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      })
      if (!response.ok) {
        throw new Error('Failed to create comment')
      }
      const newComment = await response.json()
      setComments((prev) => [...prev, newComment])
      return newComment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  const updateComment = useCallback(async (id: string, content: string) => {
    try {
      const url = API_URL ? `${API_URL}/api/project-comments/${id}` : `/api/project-comments/${id}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error('Failed to update comment')
      }
      const updatedComment = await response.json()
      setComments((prev) => prev.map((comment) => (comment.id === id ? updatedComment : comment)))
      return updatedComment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deleteComment = useCallback(async (id: string) => {
    try {
      const url = API_URL ? `${API_URL}/api/project-comments/${id}` : `/api/project-comments/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }
      setComments((prev) => prev.filter((comment) => comment.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }, [])

  return {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    refreshComments: fetchComments,
  }
}
