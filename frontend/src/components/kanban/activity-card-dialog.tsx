import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  Collapse,
  InputAdornment,
} from '@mui/material'
import { Image, Trash2 } from '@/components/ui/icons'
import { Activity } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useAchievements } from '@/hooks/use-achievements'

const API_URL = import.meta.env.VITE_API_URL || ''

interface ActivityCardDialogProps {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (activity: Activity) => Promise<void>
}

const statusOptions: { value: Activity['status']; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]

const priorityOptions: { value: Activity['priority']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

export function ActivityCardDialog({ activity, open, onOpenChange, onUpdate }: ActivityCardDialogProps) {
  const { getAuthHeaders } = useAuth()
  const { achievements } = useAchievements()
  const linkedAchievements = achievements.filter(
    (achievement) => (achievement.mode ?? 'global_auto') === 'linked_item'
  )
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'backlog' as Activity['status'],
    priority: 'medium' as Activity['priority'],
    due_date: '' as string,
    cover_image_url: '' as string | null,
    xp_reward: 1,
    deadline_bonus_percent: 0,
    achievement_id: '' as string,
  })
  const [loading, setLoading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        description: activity.description ?? '',
        status: activity.status,
        priority: activity.priority,
        due_date: activity.due_date ? new Date(activity.due_date).toISOString().slice(0, 10) : '',
        cover_image_url: activity.cover_image_url ?? null,
        xp_reward: activity.xp_reward ?? 1,
        deadline_bonus_percent: activity.deadline_bonus_percent ?? 0,
        achievement_id: activity.achievement_id ?? '',
      })
      setCoverError(null)
    }
  }, [activity])

  if (!activity) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdate({
        ...activity,
        ...formData,
        description: formData.description || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        cover_image_url: formData.cover_image_url || null,
        xp_reward: formData.xp_reward,
        deadline_bonus_percent: formData.deadline_bonus_percent,
        achievement_id: formData.achievement_id || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating activity:', error)
      alert(`Erro ao atualizar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const MAX_COVER_SIZE_MB = 10
  const MAX_COVER_SIZE_BYTES = MAX_COVER_SIZE_MB * 1024 * 1024

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activity?.id) return
    setCoverError(null)
    if (!file.type.startsWith('image/')) {
      setCoverError('Selecione uma imagem (PNG, JPG, GIF ou WebP).')
      e.target.value = ''
      return
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      setCoverError(
        `Imagem muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. O máximo permitido é ${MAX_COVER_SIZE_MB}MB.`
      )
      e.target.value = ''
      return
    }
    setCoverUploading(true)
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const baseUrl = API_URL ? `${API_URL}/api/activities` : '/api/activities'
      const res = await fetch(`${baseUrl}/${activity.id}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ image: imageBase64 }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as { error?: string }))
        const message = errBody.error || (res.status === 413 ? `Imagem muito grande. O tamanho máximo é ${MAX_COVER_SIZE_MB}MB.` : res.statusText)
        throw new Error(message)
      }
      const { url } = await res.json()
      setFormData((prev) => ({ ...prev, cover_image_url: url }))
      await onUpdate({ ...activity, cover_image_url: url })
    } catch (err) {
      console.error('Erro ao enviar imagem:', err)
      setCoverError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveCover = async () => {
    setFormData((prev) => ({ ...prev, cover_image_url: null }))
    try {
      await onUpdate({ ...activity, cover_image_url: null })
    } catch (err) {
      console.error('Erro ao remover capa:', err)
    }
  }

  const coverUrl = formData.cover_image_url

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth scroll="paper">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        style={{ display: 'none' }}
      />
      <form onSubmit={handleSubmit}>
        {/* Cover image area */}
        <Box
          sx={{
            width: '100%',
            height: 140,
            minHeight: 140,
            position: 'relative',
            bgcolor: 'action.hover',
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {coverUrl ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.35)',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Button
                size="small"
                variant="contained"
                startIcon={<Image size={20} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={coverUploading}
                sx={{ textTransform: 'none', boxShadow: 2 }}
              >
                {coverUploading ? 'Enviando...' : 'Alterar'}
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<Trash2 size={20} />}
                onClick={handleRemoveCover}
                sx={{ textTransform: 'none', boxShadow: 2 }}
              >
                Remover
              </Button>
            </Box>
          ) : (
            <Box
              onClick={() => !coverUploading && fileInputRef.current?.click()}
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: coverUploading ? 'wait' : 'pointer',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 0,
                color: 'text.secondary',
                '&:hover': coverUploading ? {} : { bgcolor: 'action.selected', borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              <Image size={40} style={{ marginBottom: 4, opacity: 0.7 }} />
              <Typography variant="body2">
                {coverUploading ? 'Enviando imagem...' : 'Clique para adicionar capa'}
              </Typography>
            </Box>
          )}
        </Box>

        <Collapse in={Boolean(coverError)}>
          {coverError && (
            <Alert
              severity="error"
              onClose={() => setCoverError(null)}
              sx={{ mx: 2, mt: 1.5 }}
            >
              {coverError}
            </Alert>
          )}
        </Collapse>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Main content */}
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <TextField
                label="Nome da atividade *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                placeholder="Ex: Revisar documentação"
              />
              <TextField
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                minRows={3}
                size="small"
                sx={{ mb: 2 }}
                placeholder="Detalhes da atividade..."
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Prioridade"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Activity['priority'] })}
                  >
                    {priorityOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Vencimento"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ width: 160 }}
                />

                {/* XP reward field */}
                <TextField
                  label="XP"
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      xp_reward: Math.max(0.01, Math.min(1000, Number(e.target.value))),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: 0.01, max: 1000, step: 0.01 }}
                  size="small"
                  sx={{ width: 80 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontSize: 11, color: 'secondary.main', fontWeight: 700 }}>+</Typography>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="% Bonus Prazo"
                  type="number"
                  value={formData.deadline_bonus_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deadline_bonus_percent: Math.max(0, Math.min(500, Number(e.target.value))),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: 0, max: 500, step: 0.01 }}
                  size="small"
                  sx={{ width: 130 }}
                />

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Conquista Vinculada</InputLabel>
                  <Select
                    value={formData.achievement_id}
                    label="Conquista Vinculada"
                    onChange={(e) => setFormData({ ...formData, achievement_id: String(e.target.value) })}
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    {linkedAchievements.map((achievement) => (
                      <MenuItem key={achievement.id} value={achievement.id}>
                        {achievement.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Sidebar: status badge */}
            <Box sx={{ width: 200, flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                Status
              </Typography>
              <Chip label={statusOptions.find((o) => o.value === formData.status)?.label} size="small" />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={() => onOpenChange(false)} disabled={loading}>
            Fechar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
