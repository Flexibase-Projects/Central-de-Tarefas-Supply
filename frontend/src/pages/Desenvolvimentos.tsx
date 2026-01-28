import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { ProjectCardDialog } from '@/components/kanban/project-card-dialog'
import { CreateProjectDialog } from '@/components/kanban/create-project-dialog'
import { useProjects } from '@/hooks/use-projects'
import { Project } from '@/types'

export default function Desenvolvimentos() {
  const { projects, loading, createProject, updateProject, moveProject } = useProjects()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setIsProjectDialogOpen(true)
  }

  const handleProjectMove = async (projectId: string, newStatus: Project['status']) => {
    try {
      await moveProject(projectId, newStatus)
      // O hook useProjects já atualiza o estado automaticamente após o moveProject
    } catch (error) {
      console.error('Error moving project:', error)
      throw error // Re-throw para que o kanban-board possa tratar o erro
    }
  }

  const handleCreateProject = async (project: Partial<Project>) => {
    try {
      await createProject(project)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  const handleUpdateProject = async (project: Project) => {
    try {
      await updateProject(project.id, project)
      setSelectedProject(project)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Carregando projetos...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden px-6 pt-4 pb-6">
        <KanbanBoard
          projects={projects}
          onProjectMove={handleProjectMove}
          onProjectClick={handleProjectClick}
        />
      </div>

      {/* Botão flutuante */}
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Novo Projeto</span>
      </Button>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateProject}
      />

      <ProjectCardDialog
        project={selectedProject}
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onUpdate={handleUpdateProject}
      />
    </div>
  )
}
