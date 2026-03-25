import { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, CircularProgress, Typography, useTheme } from '@mui/material'
import { useTeamCanvas } from '@/hooks/use-team-canvas'
import { useThemeMode } from '@/theme/ThemeProvider'
import '@excalidraw/excalidraw/index.css'

export default function CanvaEquipe() {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<any> | null>(null)
  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => setExcalidrawComponent(() => mod.Excalidraw))
  }, [])
  const { data, loading, saving, error, saveContent } = useTeamCanvas()
  const { mode } = useThemeMode()
  const excalidrawTheme = mode === 'dark' ? 'dark' : 'light'
  const muiTheme = useTheme()

  const handleChange = useCallback(
    (elements: readonly unknown[], appState: Record<string, unknown>) => {
      saveContent({
        elements: elements as unknown[],
        appState,
      })
    },
    [saveContent]
  )

  const initialData = useMemo(() => {
    if (!data?.content || typeof data.content !== 'object') return undefined
    const content = data.content as { elements?: unknown[]; appState?: Record<string, unknown> }
    const rawAppState = content.appState ?? {}
    const appState = {
      ...rawAppState,
      theme: excalidrawTheme,
      collaborators: Array.isArray(rawAppState.collaborators) ? rawAppState.collaborators : [],
    }
    return {
      elements: Array.isArray(content.elements) ? content.elements : [],
      appState,
    }
  }, [data?.content, excalidrawTheme])

  if (!ExcalidrawComponent) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography color="text.secondary">Carregando canva...</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: muiTheme.palette.background.default,
      }}
    >
      {saving && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8,
            right: 16,
            zIndex: 10,
            bgcolor: 'background.paper',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          Salvando...
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ position: 'absolute', top: 8, left: 16, zIndex: 10 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ExcalidrawComponent
          key={excalidrawTheme}
          initialData={initialData}
          onChange={handleChange}
          theme={excalidrawTheme}
        />
      </Box>
    </Box>
  )
}
