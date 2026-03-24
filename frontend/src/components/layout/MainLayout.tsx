import { ReactNode, useState } from 'react'
import { Box, useTheme, Alert } from '@mui/material'
import { AppSidebar } from './AppSidebar'
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown'
import { ViewAsUserButton } from './ViewAsUserButton'
import { useAuth } from '@/contexts/AuthContext'
import { TodoCompleteToast } from '@/components/achievements/TodoCompleteToast'
import { UserLevelProfileDrawer } from './UserLevelProfileDrawer'
import { HeaderProfileButton } from './HeaderProfileButton'

const HEADER_HEIGHT = 59

interface MainLayoutProps {
  children: ReactNode
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const sidebarWidth = sidebarCollapsed ? 72 : 256
  const theme = useTheme()
  const { isViewingAs, viewAsUser, stopViewingAs, currentUser } = useAuth()

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
          transition: (theme) => theme.transitions.create('margin', { duration: 250 }),
          overflow: 'hidden',
        }}
      >
        {/* Faixa de aviso do modo "Ver como usuário" */}
        {isViewingAs && viewAsUser && (
          <Alert
            severity="warning"
            onClose={stopViewingAs}
            sx={{ borderRadius: 0, py: 0.25, '& .MuiAlert-message': { py: 0.5 } }}
          >
            Você está visualizando o sistema como <strong>{viewAsUser.name}</strong>. Clique no × para sair deste modo.
          </Alert>
        )}

        {/* Header padrão — mesma altura do header da sidebar (59px) */}
        <Box
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewAsUserButton />
            <NotificationsDropdown />
            {currentUser && (
              <HeaderProfileButton
                name={currentUser.name}
                avatarUrl={currentUser.avatar_url}
                onClick={() => setProfileDrawerOpen(true)}
              />
            )}
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
      <UserLevelProfileDrawer open={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
    </Box>
  )
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <MainLayoutContent>{children}</MainLayoutContent>
      <TodoCompleteToast />
    </>
  )
}
