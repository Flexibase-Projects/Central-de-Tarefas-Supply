import { useState, useEffect } from 'react'
import { Activity } from '@/types'

// Use proxy if VITE_API_URL is not set, otherwise use the full URL
const API_URL = import.meta.env.VITE_API_URL || ''

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const url = API_URL ? `${API_URL}/api/activities` : '/api/activities'
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText} - ${errorText}`)
      }
      const data = await response.json()
      setActivities(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const createActivity = async (activity: Partial<Activity>) => {
    try {
      const url = API_URL ? `${API_URL}/api/activities` : '/api/activities'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create activity: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const newActivity = await response.json()
      setActivities(prev => [newActivity, ...prev])
      return newActivity
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const url = API_URL ? `${API_URL}/api/activities/${id}` : `/api/activities/${id}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update activity')
      const updatedActivity = await response.json()
      setActivities(prev => prev.map(a => a.id === id ? updatedActivity : a))
      return updatedActivity
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const deleteActivity = async (id: string) => {
    try {
      const url = API_URL ? `${API_URL}/api/activities/${id}` : `/api/activities/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete activity')
      setActivities(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    }
  }

  const moveActivity = async (activityId: string, newStatus: Activity['status']) => {
    return updateActivity(activityId, { status: newStatus })
  }

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    refetch: fetchActivities,
  }
}
