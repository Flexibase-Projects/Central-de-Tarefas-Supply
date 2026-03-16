import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Dashboard,
  MapIcon,
  Code,
  CheckSquare,
  Settings,
  Trophy,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
  BarChart2,
  Paintbrush,
  Flag,
  Person,
  TrendingUp,
} from '@/components/ui/icons';
import { Box, Divider, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProgress } from '@/hooks/use-user-progress';
import { LevelXpBar } from '@/components/master-mode/LevelXpBar';
import { getTierForLevel } from '@/utils/tier';

type NavItem = { title: string; url: string; icon: React.ElementType; permission: string | null; requireRole?: string };

const SIDEBAR_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'INSIGHT',
    items: [
      { title: 'Dashboard', url: '/', icon: Dashboard, permission: null },
      { title: 'Mapa', url: '/mapa', icon: MapIcon, permission: null },
      { title: 'Prioridades', url: '/prioridades', icon: Flag, permission: null },
      { title: 'Indicadores', url: '/indicadores', icon: BarChart2, permission: null },
    ],
  },
  {
    title: 'FERRAMENTAS',
    items: [
      { title: 'Desenvolvimentos', url: '/desenvolvimentos', icon: Code, permission: 'access_desenvolvimentos' },
      { title: 'Atividades', url: '/atividades', icon: CheckSquare, permission: 'access_atividades' },
      { title: 'Canva em Equipe', url: '/canva-equipe', icon: Paintbrush, permission: null },
    ],
  },
  {
    title: 'GESTÃO',
    items: [
      { title: 'Administração', url: '/admin', icon: Settings, permission: null, requireRole: 'admin' },
    ],
  },
];

// Footer gamification links (always shown)
const FOOTER_NAV_ITEMS: { title: string; url: string; icon: React.ElementType }[] = [
  { title: 'Conquistas', url: '/conquistas', icon: Trophy },
  { title: 'Progressão', url: '/niveis', icon: TrendingUp },
];

interface AppSidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AppSidebar(props: AppSidebarProps = {}) {
  const { isCollapsed: controlledCollapsed, onCollapsedChange } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { hasPermission, hasRole } = usePermissions();
  const { logout, currentUser } = useAuth();
  const { data: progressData, loading: progressLoading } = useUserProgress();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setIsCollapsed = (v: boolean) => {
    onCollapsedChange?.(v);
    if (!onCollapsedChange) setInternalCollapsed(v);
  };

  const visibleSections = useMemo(() => {
    return SIDEBAR_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requireRole) return hasRole(item.requireRole);
        if (item.permission) return hasPermission(item.permission);
        return true;
      }),
    })).filter((s) => s.items.length > 0);
  }, [hasPermission, hasRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebarBg = isLight ? '#F1F5F9' : theme.palette.background.default;
  const borderColor = theme.palette.divider;
  const activeColor = theme.palette.primary.main;
  const hoverBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';

  const isActiveLink = (url: string) => location.pathname === url;

  const renderNavLink = (
    url: string,
    icon: React.ElementType,
    label: string,
    iconStyle?: React.CSSProperties
  ) => {
    const Icon = icon;
    const active = isActiveLink(url);
    return (
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
          to={url}
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            borderRadius: 6,
            padding: isCollapsed ? '7px 0' : '7px 10px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 8,
            backgroundColor: active
              ? isLight ? 'rgba(37,99,235,0.08)' : 'rgba(96,165,250,0.12)'
              : 'transparent',
            color: active ? activeColor : 'inherit',
            transition: 'background-color 0.15s, color 0.15s',
          }}
          onMouseOver={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseOut={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Icon size={16} style={{ flexShrink: 0, ...iconStyle }} />
          {!isCollapsed && (
            <Box
              component="span"
              sx={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Box>
          )}
        </Link>
      </Box>
    );
  };

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
        width: isCollapsed ? 64 : 240,
        transition: theme.transitions.create('width', { duration: 250 }),
        bgcolor: sidebarBg,
        color: 'text.primary',
      }}
    >
      {/* Header */}
      {isCollapsed ? (
        <Box sx={{ borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <Box sx={{ minHeight: 52, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box component="img" src="/logo.png" alt="CDT" sx={{ width: 28, height: 28, objectFit: 'contain' }} />
          </Box>
          <Tooltip title="Expandir" placement="right">
            <IconButton
              onClick={() => setIsCollapsed(false)}
              sx={{ width: '100%', borderRadius: 0, py: 1.25 }}
              size="small"
            >
              <Menu size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            borderBottom: `1px solid ${borderColor}`,
            minHeight: 52,
            py: 1.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="CDT"
            sx={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
          />
          <Box sx={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.4, color: 'text.primary', lineHeight: 1.25 }}>
            CDT
          </Box>
          <Tooltip title="Recolher">
            <IconButton onClick={() => setIsCollapsed(true)} size="small" sx={{ ml: 'auto', mr: -0.5 }}>
              <ChevronLeft size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1.5,
          px: isCollapsed ? 0.5 : 1.5,
        }}
      >
        {visibleSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {sectionIndex > 0 && (
              <Divider sx={{ borderColor: borderColor, my: 1 }} />
            )}
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
                  px: 1,
                  m: 0,
                  mb: 0.5,
                }}
              >
                {section.title}
              </Box>
            )}
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActiveLink(item.url);
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
                        padding: isCollapsed ? '8px 0' : '7px 10px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: 8,
                        backgroundColor: active
                          ? isLight ? 'rgba(37,99,235,0.08)' : 'rgba(96,165,250,0.12)'
                          : 'transparent',
                        color: active ? activeColor : 'inherit',
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                      onMouseOver={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = hoverBg;
                      }}
                      onMouseOut={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      {!isCollapsed && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 13,
                            fontWeight: active ? 500 : 400,
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
                );
                return isCollapsed ? (
                  <Tooltip key={item.url} title={item.title} placement="right">
                    <Box>{link}</Box>
                  </Tooltip>
                ) : (
                  <Box key={item.url}>{link}</Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: `1px solid ${borderColor}`,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          flexShrink: 0,
        }}
      >
        {/* XP Bar widget — links to /niveis */}
        {!isCollapsed && (
          <Tooltip title="Ver progressão de nível" placement="right">
            <Link
              to="/niveis"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 4 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: `1px solid ${borderColor}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    bgcolor: isLight ? 'rgba(124,58,237,0.05)' : 'rgba(167,139,250,0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.15)',
                    color: 'secondary.main',
                  }}
                >
                  <BarChart2 size={14} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <LevelXpBar progress={progressData} loading={progressLoading} compact />
                  {progressData?.level != null && (() => {
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
            </Link>
          </Tooltip>
        )}

        {/* Gamification nav links: Conquistas + Progressão */}
        {FOOTER_NAV_ITEMS.map((item) => {
          const iconStyle: React.CSSProperties =
            item.url === '/conquistas' ? { color: '#F59E0B' } : {}
          const link = renderNavLink(item.url, item.icon, item.title, iconStyle)
          return isCollapsed ? (
            <Tooltip key={item.url} title={item.title} placement="right">
              <Box>{link}</Box>
            </Tooltip>
          ) : (
            <Box key={item.url}>{link}</Box>
          )
        })}

        <Divider sx={{ borderColor: borderColor, my: 0.25 }} />

        {/* Tutorial / Como Funciona */}
        <Tooltip title={isCollapsed ? 'Como Funciona?' : undefined} placement="right">
          <Box sx={{ position: 'relative' }}>
            {location.pathname === '/tutorial' && (
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
              to="/tutorial"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                borderRadius: 6,
                padding: isCollapsed ? '7px 0' : '7px 10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 8,
                backgroundColor: location.pathname === '/tutorial'
                  ? isLight ? 'rgba(37,99,235,0.08)' : 'rgba(96,165,250,0.12)'
                  : 'transparent',
                color: location.pathname === '/tutorial' ? activeColor : 'inherit',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => {
                if (location.pathname !== '/tutorial') e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseOut={(e) => {
                if (location.pathname !== '/tutorial') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <HelpCircle size={16} style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 13,
                    fontWeight: location.pathname === '/tutorial' ? 500 : 400,
                  }}
                >
                  Como Funciona?
                </Box>
              )}
            </Link>
          </Box>
        </Tooltip>

        <Divider sx={{ borderColor: borderColor, my: 0.25 }} />

        {/* User row: Perfil link + logout */}
        {!isCollapsed && currentUser ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 0.5,
              width: '100%',
              px: 0.5,
              py: 0.5,
            }}
          >
            <Tooltip title="Ver meu perfil" placement="right">
              <Link
                to="/perfil"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 400,
                  color: isActiveLink('/perfil')
                    ? activeColor
                    : theme.palette.text.primary,
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = activeColor; }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = isActiveLink('/perfil')
                    ? activeColor
                    : theme.palette.text.primary;
                }}
              >
                <Person size={14} style={{ flexShrink: 0 }} />
                <Box
                  component="span"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {currentUser.name}
                </Box>
              </Link>
            </Tooltip>
            <Tooltip title="Sair" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 1,
                  p: 0.5,
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light', color: 'error.dark' },
                }}
                size="small"
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Tooltip title={isCollapsed ? 'Sair' : undefined} placement="right">
            <IconButton
              onClick={handleLogout}
              sx={{
                width: '100%',
                borderRadius: 1,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                py: 0.875,
                px: isCollapsed ? 0 : 1.25,
                gap: 1,
                color: 'error.main',
                '&:hover': { bgcolor: 'error.light', color: 'error.dark' },
              }}
              size="small"
            >
              <LogOut size={16} />
              {!isCollapsed && <Box component="span" sx={{ fontSize: 13, fontWeight: 400 }}>Sair</Box>}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
