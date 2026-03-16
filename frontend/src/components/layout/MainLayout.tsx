import { ReactNode, useState } from 'react'
import { Box, IconButton, Tooltip, useTheme } from '@mui/material'
import { AppSidebar } from './AppSidebar'
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown'
import { useThemeMode } from '@/theme/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

function TopBar() {
  const { mode, toggleTheme } = useThemeMode()
  const theme = useTheme()
  const isLight = mode === 'light'

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        pr: 2,
        height: 52,
        gap: 0.5,
        pointerEvents: 'none',
      }}
    >
      <Box sx={{ pointerEvents: 'auto' }}>
        <Tooltip title={isLight ? 'Modo escuro' : 'Modo claro'} placement="bottom">
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                borderColor: 'primary.main',
                bgcolor: isLight ? 'rgba(37,99,235,0.06)' : 'rgba(96,165,250,0.1)',
              },
              transition: 'all 0.15s',
            }}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarWidth = sidebarCollapsed ? 64 : 240

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar isCollapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <TopBar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: `${sidebarWidth}px`,
          transition: (theme) => theme.transitions.create('margin', { duration: 250 }),
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
      <NotificationsDropdown />
    </Box>
  )
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainLayoutContent>{children}</MainLayoutContent>
}
