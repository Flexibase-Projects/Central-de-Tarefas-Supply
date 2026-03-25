import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || ''

type FeatureFlagsContextValue = {
  gamificationEnabled: boolean
  loading: boolean
  refresh: () => Promise<void>
  setGamificationEnabled: (enabled: boolean) => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined)

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { getAuthHeaders } = useAuth()
  const [gamificationEnabled, setGamificationEnabledState] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const url = API_URL ? `${API_URL}/api/settings/feature-flags` : '/api/settings/feature-flags'
      const response = await fetch(url, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('Falha ao carregar configurações')
      const data = await response.json()
      setGamificationEnabledState(data?.gamificationEnabled === true)
    } catch {
      setGamificationEnabledState(false)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const setGamificationEnabled = useCallback(
    async (enabled: boolean) => {
      const url = API_URL ? `${API_URL}/api/settings/feature-flags` : '/api/settings/feature-flags'
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ gamificationEnabled: enabled }),
      })
      if (!response.ok) throw new Error('Falha ao salvar configuração')
      setGamificationEnabledState(enabled)
    },
    [getAuthHeaders],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ gamificationEnabled, loading, refresh, setGamificationEnabled }),
    [gamificationEnabled, loading, refresh, setGamificationEnabled],
  )

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (!context) throw new Error('useFeatureFlags deve ser usado dentro de FeatureFlagsProvider')
  return context
}
