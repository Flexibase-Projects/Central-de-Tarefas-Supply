import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Project } from '@/types'
import { ExternalLink, GitBranch, Calendar, User } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface ProjectCardDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (project: Project) => void
}

export function ProjectCardDialog({
  project,
  open,
  onOpenChange,
  onUpdate,
}: ProjectCardDialogProps) {
  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            {project.description || 'Sem descrição'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* GitHub Repository Info */}
            {project.github_url && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Repositório GitHub
                </h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {project.github_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Informações do GitHub serão exibidas aqui quando o token estiver configurado
                  </p>
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Informações do Projeto</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{project.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {project.updated_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Commits Section (Prepared for GitHub API) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Commits Recentes</h3>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Os commits serão exibidos aqui quando a integração com GitHub estiver configurada.
                </p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Comentários</h3>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Sistema de comentários será implementado em breve.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
