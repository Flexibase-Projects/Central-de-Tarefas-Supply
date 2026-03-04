import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
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
} from '@mui/material'
import { Activity } from '@/types'

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'backlog' as Activity['status'],
    priority: 'medium' as Activity['priority'],
    due_date: '' as string,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        description: activity.description || '',
        status: activity.status,
        priority: activity.priority,
        due_date: activity.due_date ? new Date(activity.due_date).toISOString().slice(0, 10) : '',
      })
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
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating activity:', error)
      alert(`Erro ao atualizar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Detalhes da Atividade</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Visualize e edite os detalhes da atividade
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Activity['status'] })}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={formData.priority}
                  label="Prioridade"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Activity['priority'] })}
                >
                  {priorityOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Data de Vencimento"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => onOpenChange(false)} disabled={loading}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
