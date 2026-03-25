import { useState } from 'react'
import { Alert, Box, CircularProgress, FormControlLabel, Paper, Switch, Typography } from '@mui/material'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

export function FeatureFlagsSettings() {
  const { gamificationEnabled, loading, setGamificationEnabled } = useFeatureFlags()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    try {
      setSaving(true)
      setError(null)
      await setGamificationEnabled(checked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar configuração')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        Funcionalidades
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Controle recursos globais do sistema Supply.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={gamificationEnabled}
              onChange={handleToggle}
              disabled={loading || saving}
              color="warning"
            />
          }
          label="Gamificação"
        />
        {(loading || saving) && <CircularProgress size={20} />}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Quando desativada, conquistas, níveis, XP e telas relacionadas ficam ocultas para todos.
      </Typography>
    </Paper>
  )
}
