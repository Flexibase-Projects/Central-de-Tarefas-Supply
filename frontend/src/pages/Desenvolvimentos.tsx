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
    } catch (error) {
      console.error('Error moving project:', error)
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 p-6 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Desenvolvimentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos de desenvolvimento em um Kanban interativo
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <KanbanBoard
          projects={projects}
          onProjectMove={handleProjectMove}
          onProjectClick={handleProjectClick}
        />
      </div>

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
