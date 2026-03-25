import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material'
import {
  Calendar,
  CheckSquare,
  MessageCircleIcon,
  Settings,
  Trash2,
  Pencil,
} from '@/components/ui/icons'
import { Project } from '@/types'
import { usePermissions } from '@/hooks/use-permissions'
import { TodoList } from './todo-list'
import { CommentsSection } from './comments-section'

interface ProjectCardDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (project: Project) => void
  onDelete?: (projectId: string) => Promise<void>
  highlightedTodoId?: string | null
}

export function ProjectCardDialog({
  project,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  highlightedTodoId,
}: ProjectCardDialogProps) {
  const { hasPermission } = usePermissions()
  const canEditProject = hasPermission('manage_projects')
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<0 | 1 | 2>(0)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editProjectUrl, setEditProjectUrl] = useState('')
  const [editUrlLoading, setEditUrlLoading] = useState(false)

  useEffect(() => {
    if (open && project) {
      setEditProjectUrl(project.project_url || '')
    }
  }, [open, project?.project_url])

  const handleExcluirCard = () => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1)
      return
    }
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2)
      return
    }
    if (deleteConfirmStep === 2 && project && onDelete) {
      setDeleteLoading(true)
      onDelete(project.id)
        .then(() => {
          setDeleteConfirmStep(0)
          onOpenChange(false)
        })
        .catch(() => setDeleteLoading(false))
        .finally(() => setDeleteLoading(false))
    }
  }

  if (!project) return null

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setDeleteConfirmStep(0)
          onOpenChange(false)
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>{project.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {project.description || 'Sem descrição'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, height: 'calc(90vh - 120px)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: 1, overflow: 'auto', pr: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckSquare size={18} /> TO-DO
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <TodoList projectId={project.id} highlightedTodoId={highlightedTodoId} contextName={project.name} />
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MessageCircleIcon size={18} /> Comentários
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <CommentsSection projectId={project.id} />
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Informações do Projeto</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2"><Typography component="span" color="text.secondary">Status:</Typography> {project.status.replace('_', ' ')}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Calendar size={16} />
                          <Typography variant="body2" color="text.secondary">Criado em:</Typography>
                          <Typography variant="body2">{new Date(project.created_at).toLocaleDateString('pt-BR')}</Typography>
                        </Box>
                        {project.updated_at && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={16} />
                            <Typography variant="body2" color="text.secondary">Atualizado em:</Typography>
                            <Typography variant="body2">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                  {canEditProject && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Settings size={18} /> Configurações
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Pencil size={14} /> Editar card — Link do projeto
                          </Typography>
                          <TextField
                            size="small"
                            type="url"
                            value={editProjectUrl}
                            onChange={(e) => setEditProjectUrl(e.target.value)}
                            placeholder="https://app.exemplo.com"
                            fullWidth
                          />
                          <Button variant="contained" size="small" onClick={async () => { setEditUrlLoading(true); try { await onUpdate({ ...project, project_url: editProjectUrl || null }); } finally { setEditUrlLoading(false); } }} disabled={editUrlLoading}>
                            {editUrlLoading ? 'Salvando...' : 'Salvar link'}
                          </Button>
                        </Box>
                        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5, mt: 1.5 }}>
                          <Button variant="outlined" color="error" size="small" onClick={() => setDeleteConfirmStep(1)} disabled={!onDelete} startIcon={<Trash2 size={20} />}>
                            Excluir este card
                          </Button>
                        </Box>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmStep > 0} onClose={() => setDeleteConfirmStep(0)} maxWidth="xs" fullWidth>
        <DialogTitle>{deleteConfirmStep === 1 ? 'Excluir projeto?' : 'Confirmar exclusão'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleteConfirmStep === 1
              ? `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`
              : 'Para confirmar, clique em "Sim, excluir". O projeto será removido permanentemente.'}
          </Typography>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 2 }}>
          {deleteConfirmStep === 1 ? (
            <>
              <Button onClick={() => setDeleteConfirmStep(0)}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={() => setDeleteConfirmStep(2)}>Excluir</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setDeleteConfirmStep(1)}>Voltar</Button>
              <Button variant="contained" color="error" onClick={handleExcluirCard} disabled={deleteLoading} startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : undefined}>
                {deleteLoading ? 'Excluindo...' : 'Sim, excluir'}
              </Button>
            </>
          )}
        </Box>
      </Dialog>
    </>
  )
}
