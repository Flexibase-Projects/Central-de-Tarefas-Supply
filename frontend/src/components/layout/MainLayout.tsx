import { ReactNode, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography } from '@mui/material'
import { AppSidebar } from './AppSidebar'
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown'

interface MainLayoutProps {
  children: ReactNode
}

const menuCategories = [
  { label: 'Insight', items: [{ title: 'Dashboard', url: '/', description: 'Visão geral do departamento de Inteligência' }, { title: 'Mapa', url: '/mapa', description: 'Visualização em mapa dos projetos e atividades' }] },
  { label: 'Lançamentos', items: [{ title: 'Desenvolvimentos', url: '/desenvolvimentos', description: 'Gerencie seus projetos de desenvolvimento em um Kanban interativo' }, { title: 'Atividades', url: '/atividades', description: 'Gerencie suas atividades em um Kanban interativo' }] },
  { label: 'Gestão', items: [{ title: 'Administração', url: '/admin', description: 'Gerencie usuários, cargos e permissões do sistema' }] },
]

function MainLayoutContent({ children }: MainLayoutProps) {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const pageInfo = useMemo(() => {
    for (const category of menuCategories) {
      const item = category.items.find((i) => i.url === location.pathname)
      if (item) return { title: item.title, description: item.description }
    }
    return { title: '', description: '' }
  }, [location.pathname])

  const sidebarWidth = sidebarCollapsed ? 72 : 240

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar isCollapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: `${sidebarWidth}px`,
          transition: (theme) => theme.transitions.create('margin', { duration: 300 }),
        }}
      >
        <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ minHeight: 80, gap: 2 }}>
            {pageInfo.title && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
                  {pageInfo.title}
                </Typography>
                {pageInfo.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {pageInfo.description}
                  </Typography>
                )}
              </Box>
            )}
            {!pageInfo.title && <Box sx={{ flex: 1 }} />}
            <NotificationsDropdown />
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainLayoutContent>{children}</MainLayoutContent>
}
