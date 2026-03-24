import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface UseProfileDrawerActionsParams {
  onClose: () => void
}

export function useProfileDrawerActions({ onClose }: UseProfileDrawerActionsParams) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const goPerfil = useCallback(() => {
    onClose()
    navigate('/perfil')
  }, [navigate, onClose])

  const goIndicadores = useCallback(() => {
    onClose()
    navigate('/indicadores')
  }, [navigate, onClose])

  const handleLogout = useCallback(async () => {
    onClose()
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate, onClose])

  return {
    goPerfil,
    goIndicadores,
    handleLogout,
  }
}
