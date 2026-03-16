import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Achievement } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useAchievements() {
  const { getAuthHeaders } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const url = API_URL ? `${API_URL}/api/achievements` : '/api/achievements'
        const response = await fetch(url, { headers: getAuthHeaders() })
        if (!response.ok) throw new Error('Falha ao carregar conquistas')
        const data = await response.json()
        setAchievements(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro')
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [getAuthHeaders])

  return { achievements, loading, error }
}
