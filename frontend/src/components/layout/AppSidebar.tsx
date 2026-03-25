import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Dashboard,
  MapIcon,
  Code,
  CheckSquare,
  Settings,
  ChevronLeft,
  Menu,
  BarChart2,
  Paintbrush,
  Flag,
  OrgChartIcon,
  DollarSign,
} from '@/components/ui/icons'
import {
  Box,
  Badge,
  Divider,
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { Sun, Moon } from 'lucide-react'
import { useThemeMode } from '@/theme/ThemeProvider'
import { usePermissions } from '@/hooks/use-permissions'
import { LevelXpBar } from '@/components/master-mode/LevelXpBar'
import { getTierForLevel } from '@/utils/tier'
import { getLevelCardMenuItems } from '@/components/layout/sidebar-level-nav'
import type { UserProgress } from '@/types'

type NavItem = { title: string; url: string; icon: React.ElementType; permission: string | null; requireRole?: string }

const SIDEBAR_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'INSIGHT',
    items: [
      { title: 'Dashboard', url: '/', icon: Dashboard, permission: 'access_insight' },
      { title: 'Mapa', url: '/mapa', icon: MapIcon, permission: 'access_insight' },
      { title: 'Prioridades', url: '/prioridades', icon: Flag, permission: 'access_insight' },
      { title: 'Indicadores', url: '/indicadores', icon: BarChart2, permission: 'access_insight' },
    ],
  },
  {
    title: 'FERRAMENTAS',
    items: [
      { title: 'Kanban — Projetos', url: '/desenvolvimentos', icon: Code, permission: 'access_desenvolvimentos' },
      { title: 'Kanban — Atividades', url: '/atividades', icon: CheckSquare, permission: 'access_atividades' },
      { title: 'Canva em Equipe', url: '/canva-equipe', icon: Paintbrush, permission: null },
      { title: 'Organograma', url: '/organograma', icon: OrgChartIcon, permission: null, requireRole: 'admin' },
      { title: 'Custos', url: '/custos-departamento', icon: DollarSign, permission: null, requireRole: 'admin' },
    ],
  },
  {
    title: 'GESTÃO',
    items: [{ title: 'Configurações', url: '/configuracoes', icon: Settings, permission: null, requireRole: 'admin' }],
  },
]

interface AppSidebarProps {
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  pendingTodosCount: number | null
  progressData: UserProgress | null
  progressLoading: boolean
  gamificationEnabled: boolean
}

export function DemandCard({
  count,
  compact = false,
  headerInline = false,
}: {
  count: number | null
  compact?: boolean
  /** Uma linha, altura contida — para header com sidebar retraída */
  headerInline?: boolean
}) {
  const resolvedCount = count ?? 0
  const hasPending = resolvedCount > 0

  if (headerInline) {
    const labelShort = hasPending ? 'em aberto' : 'concluídas'
    return (
      <Tooltip
        title={
          <>
            {resolvedCount.toString().padStart(2, '0')}{' '}
            {hasPending ? 'entregas em aberto' : 'entregas concluídas'} — Abrir indicadores
          </>
        }
        placement="bottom"
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: hasPending ? 'rgba(245,158,11,0.35)' : 'rgba(59,130,246,0.18)',
            background: hasPending
              ? 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(217,119,6,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(14,165,233,0.05) 100%)',
            boxShadow: 'none',
            flexShrink: 0,
            maxHeight: 44,
          }}
        >
          <Box
            component={Link}
            to="/indicadores"
            sx={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1,
              py: 0.35,
              color: 'text.primary',
              minHeight: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: hasPending ? 'warning.dark' : 'primary.main',
                fontSize: 7,
                lineHeight: 1.15,
                maxWidth: 56,
              }}
            >
              Minhas demandas
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.65,
                py: 0.2,
                borderRadius: 1,
                bgcolor: hasPending ? '#D97706' : 'rgba(37,99,235,0.75)',
                border: '1px solid',
                borderColor: 'rgba(255,255,255,0.25)',
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  lineHeight: 1,
                  letterSpacing: -0.02,
                  color: '#fff',
                }}
              >
                {resolvedCount.toString().padStart(2, '0')}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 9,
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.92)',
                  display: { xs: 'none', sm: 'block' },
                  maxWidth: 52,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {labelShort}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Tooltip>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: hasPending ? 'rgba(245,158,11,0.35)' : 'rgba(59,130,246,0.18)',
        background: hasPending
          ? 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(217,119,6,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.06) 100%)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Box
        component={Link}
        to="/indicadores"
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <Box sx={{ p: compact ? 1 : 1.05, color: 'text.primary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: hasPending ? 'warning.dark' : 'primary.main',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              Minhas demandas
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 0.6,
              px: 0.9,
              py: 0.35,
              borderRadius: 1.25,
              bgcolor: hasPending ? '#D97706' : 'rgba(37,99,235,0.75)',
              border: '1px solid',
              borderColor: hasPending ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)',
              boxShadow: hasPending
                ? '0 0 0 1px rgba(245,158,11,0.044), 0 0 16px rgba(245,158,11,0.09)'
                : '0 0 0 1px rgba(37,99,235,0.036), 0 0 12px rgba(37,99,235,0.07)',
              minWidth: 170,
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: hasPending
                  ? '0 0 0 1px rgba(245,158,11,0.22), 0 0 16px rgba(245,158,11,0.45)'
                  : '0 0 0 1px rgba(37,99,235,0.18), 0 0 12px rgba(37,99,235,0.35)',
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1,
                letterSpacing: -0.02,
                color: '#fff',
              }}
            >
              {resolvedCount.toString().padStart(2, '0')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                lineHeight: 1.1,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              {hasPending ? 'entregas em aberto' : 'entregas concluídas'}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              mt: 0.6,
              display: 'inline-block',
              color: hasPending ? 'warning.dark' : 'primary.dark',
              fontWeight: 700,
              fontSize: 10.5,
              textAlign: 'center',
            }}
          >
            Abrir indicadores
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export function AppSidebar(props: AppSidebarProps) {
  const {
    isCollapsed: controlledCollapsed,
    onCollapsedChange,
    pendingTodosCount,
    progressData,
    progressLoading,
    gamificationEnabled,
  } = props
  const levelMenuItems = getLevelCardMenuItems(gamificationEnabled)

  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const { mode, toggleTheme } = useThemeMode()
  const { hasPermission, hasRole } = usePermissions()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [levelMenuAnchor, setLevelMenuAnchor] = useState<HTMLElement | null>(null)
  const isCollapsed = controlledCollapsed ?? internalCollapsed

  const setIsCollapsed = (v: boolean) => {
    onCollapsedChange?.(v)
    if (!onCollapsedChange) setInternalCollapsed(v)
  }

  const visibleSections = useMemo(() => {
    return SIDEBAR_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requireRole) return hasRole(item.requireRole)
        if (item.permission) return hasPermission(item.permission)
        return true
      }),
    })).filter((s) => s.items.length > 0)
  }, [hasPermission, hasRole])

  const sidebarBg = isLight ? '#ffffff' : theme.palette.background.default
  const borderColor = theme.palette.divider
  const activeColor = theme.palette.primary.main
  const hoverBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'

  const isActiveLink = (url: string) =>
    url === '/configuracoes'
      ? location.pathname === '/configuracoes' || location.pathname.startsWith('/configuracoes/')
      : location.pathname === url

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${borderColor}`,
        zIndex: 1200,
        width: isCollapsed ? 72 : 256,
        transition: theme.transitions.create('width', { duration: 250 }),
        bgcolor: sidebarBg,
        color: 'text.primary',
      }}
    >
      {isCollapsed ? (
        <Box sx={{ borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Box sx={{ minHeight: 56, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tooltip
              title={
                pendingTodosCount
                  ? `${pendingTodosCount} TO-DO${pendingTodosCount > 1 ? 's' : ''} pendente${pendingTodosCount > 1 ? 's' : ''}`
                  : 'CDT'
              }
              placement="right"
            >
              <Badge
                badgeContent={pendingTodosCount ?? 0}
                color="warning"
                max={99}
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16 } }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11, letterSpacing: 0.2 }}>
                  CDT
                </Typography>
              </Badge>
            </Tooltip>
          </Box>
          <Tooltip title="Expandir" placement="right">
            <IconButton onClick={() => setIsCollapsed(false)} sx={{ width: '100%', borderRadius: 0, py: 1.25 }} size="small">
              <Menu size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            borderBottom: `1px solid ${borderColor}`,
            minHeight: 56,
            py: 2,
            px: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.4, color: 'text.primary', lineHeight: 1.25 }}>
            SUPPLY
          </Typography>
          <Tooltip title="Recolher">
            <IconButton onClick={() => setIsCollapsed(true)} size="small" sx={{ ml: 'auto', mr: -0.5 }}>
              <ChevronLeft size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {!isCollapsed && (
        <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
          <DemandCard count={pendingTodosCount} />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2.5,
          px: isCollapsed ? 0.75 : 1.5,
        }}
      >
        {visibleSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {sectionIndex > 0 && <Divider sx={{ borderColor: borderColor, my: 2 }} />}
            {!isCollapsed && (
              <Box
                component="p"
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  color: 'text.disabled',
                  mt: sectionIndex === 0 ? 0 : 0.5,
                  px: 1.5,
                  m: 0,
                  mb: 1,
                }}
              >
                {section.title}
              </Box>
            )}
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: sectionIndex < visibleSections.length - 1 ? 2.5 : 0 }}>
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActiveLink(item.url)
                const link = (
                  <Box sx={{ position: 'relative' }}>
                    {active && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: '60%',
                          width: 3,
                          borderRadius: '0 2px 2px 0',
                          bgcolor: activeColor,
                          zIndex: 1,
                        }}
                      />
                    )}
                    <Link
                      to={item.url}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: 6,
                        padding: isCollapsed ? '10px 0' : '10px 12px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: 12,
                        backgroundColor: active ? (isLight ? 'rgba(37,99,235,0.08)' : 'rgba(96,165,250,0.12)') : 'transparent',
                        color: active ? activeColor : 'inherit',
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                      onMouseOver={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = hoverBg
                      }}
                      onMouseOut={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </Box>
                      )}
                    </Link>
                  </Box>
                )
                return isCollapsed ? (
                  <Tooltip key={item.url} title={item.title} placement="right">
                    <Box>{link}</Box>
                  </Tooltip>
                ) : (
                  <Box key={item.url}>{link}</Box>
                )
              })}
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Tooltip title={isCollapsed ? (mode === 'light' ? 'Modo escuro' : 'Modo claro') : undefined} placement="right">
          <Box
            component="button"
            type="button"
            onClick={toggleTheme}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              px: isCollapsed ? 0 : 1,
              py: 0.75,
              borderRadius: 1.5,
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
              bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              color: 'text.secondary',
              textAlign: 'left',
              transition: 'border-color 0.15s, background-color 0.15s, color 0.15s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              mb: 0.5,
              '&:hover': {
                color: 'primary.main',
                borderColor: theme.palette.primary.main,
                bgcolor: isLight ? 'rgba(37,99,235,0.06)' : 'rgba(96,165,250,0.1)',
              },
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>
              {mode === 'light' ? <Moon size={16} style={{ flexShrink: 0 }} /> : <Sun size={16} style={{ flexShrink: 0 }} />}
            </span>
            {!isCollapsed && (
              <Box component="span" sx={{ fontSize: 13, fontWeight: 600 }}>
                {mode === 'light' ? 'Modo escuro' : 'Modo claro'}
              </Box>
            )}
          </Box>
        </Tooltip>

        {!isCollapsed && gamificationEnabled && (
          <>
            <Box
              component="button"
              type="button"
              onClick={(e) => setLevelMenuAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                width: '100%',
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
                bgcolor: 'transparent',
                color: 'inherit',
                textAlign: 'left',
                transition: 'border-color 0.15s, background-color 0.15s',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  bgcolor: isLight ? 'rgba(124,58,237,0.05)' : 'rgba(167,139,250,0.08)',
                },
                justifyContent: 'flex-start',
                mb: 0.5,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.15)',
                  color: 'secondary.main',
                }}
              >
                <span style={{ display: 'inline-flex' }}>
                  <BarChart2 size={14} />
                </span>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <LevelXpBar progress={progressData} loading={progressLoading} compact />
                {progressData?.level != null &&
                  (() => {
                    const t = getTierForLevel(progressData.level)
                    return (
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 10, fontWeight: 600, color: t.color, lineHeight: 1, display: 'block', mt: 0.25 }}
                      >
                        {t.name}
                      </Typography>
                    )
                  })()}
              </Box>
            </Box>

            <MuiMenu
              anchorEl={levelMenuAnchor}
              open={Boolean(levelMenuAnchor)}
              onClose={() => setLevelMenuAnchor(null)}
              anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
              transformOrigin={{ vertical: 'center', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 200,
                    mt: 0,
                    ml: 0.5,
                    borderRadius: 2,
                    boxShadow: theme.shadows[8],
                  },
                },
              }}
            >
              {levelMenuItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.url
                return (
                  <MenuItem
                    key={item.url}
                    onClick={() => {
                      setLevelMenuAnchor(null)
                      navigate(item.url)
                    }}
                    sx={{
                      gap: 1.5,
                      py: 1.25,
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? activeColor : 'text.primary',
                    }}
                  >
                    <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                      <Icon size={18} style={{ flexShrink: 0, ...item.iconStyle }} />
                    </span>
                    {item.title}
                  </MenuItem>
                )
              })}
            </MuiMenu>
          </>
        )}

      </Box>
    </Box>
  )
}
