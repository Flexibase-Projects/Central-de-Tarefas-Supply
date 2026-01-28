import { useState, useEffect } from 'react'
import { Project } from '@/types'

// Use proxy if VITE_API_URL is not set, otherwise use the full URL
const API_URL = import.meta.env.VITE_API_URL || ''

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const url = API_URL ? `${API_URL}/api/projects` : '/api/projects'
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText} - ${errorText}`)
      }
      const data = await response.json()
      setProjects(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (project: Partial<Project>) => {
    try {
      const url = API_URL ? `${API_URL}/api/projects` : '/api/projects'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create project: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const url = API_URL ? `${API_URL}/api/projects/${id}` : `/api/projects/${id}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update project')
      const updatedProject = await response.json()
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
      return updatedProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const url = API_URL ? `${API_URL}/api/projects/${id}` : `/api/projects/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete project')
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const moveProject = async (projectId: string, newStatus: Project['status']) => {
    return updateProject(projectId, { status: newStatus })
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    moveProject,
    refetch: fetchProjects,
  }
}
