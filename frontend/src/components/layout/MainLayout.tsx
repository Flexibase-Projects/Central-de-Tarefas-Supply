import { ReactNode } from 'react'
import * as React from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/sidebar'
import { LayoutDashboard, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Desenvolvimentos',
    url: '/desenvolvimentos',
    icon: Code2,
  },
]

function MainLayoutContent({ children }: MainLayoutProps) {
  const location = useLocation()
  const { state } = useSidebar()

  return (
    <div className="flex h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className={cn(
            "flex items-center w-full",
            state === 'expanded' ? "gap-2 px-2" : "justify-center px-0"
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            {state === 'expanded' && (
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold truncate">CDT Inteligência</div>
                <div className="text-xs text-sidebar-foreground/70 truncate">Central de Tarefas</div>
              </div>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <div className="flex-1" />
        </header>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  )
}
