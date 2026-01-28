import { useState } from 'react'
import { GitHubRepository, GitHubCommit } from '@/types'

// Use proxy if VITE_API_URL is not set, otherwise use the full URL
const API_URL = import.meta.env.VITE_API_URL || ''

export function useGitHub() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRepositoryInfo = async (url: string): Promise<GitHubRepository | null> => {
    try {
      setLoading(true)
      setError(null)
      const fetchUrl = API_URL ? `${API_URL}/api/github/repo?url=${encodeURIComponent(url)}` : `/api/github/repo?url=${encodeURIComponent(url)}`
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch repository info')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching repository info:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getRecentCommits = async (url: string, limit: number = 10): Promise<GitHubCommit[]> => {
    try {
      setLoading(true)
      setError(null)
      const fetchUrl = API_URL ? `${API_URL}/api/github/commits?url=${encodeURIComponent(url)}&limit=${limit}` : `/api/github/commits?url=${encodeURIComponent(url)}&limit=${limit}`
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch commits')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching commits:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  const getContributors = async (url: string) => {
    try {
      setLoading(true)
      setError(null)
      const fetchUrl = API_URL ? `${API_URL}/api/github/contributors?url=${encodeURIComponent(url)}` : `/api/github/contributors?url=${encodeURIComponent(url)}`
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch contributors')
      }
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching contributors:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    getRepositoryInfo,
    getRecentCommits,
    getContributors,
  }
}
