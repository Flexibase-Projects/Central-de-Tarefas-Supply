import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, LinearProgress, Menu as MuiMenu, MenuItem, Tooltip, Typography, useTheme } from '@mui/material'
import { DemandCard } from '@/components/layout/AppSidebar'
import { LEVEL_CARD_MENU_ITEMS } from '@/components/layout/sidebar-level-nav'
import { TierBadge } from '@/components/gamification/TierBadge'
import { getTierForLevel } from '@/utils/tier'
import type { UserProgress } from '@/types'

export interface HeaderCollapsedSidebarToolsProps {
  pendingTodosCount: number | null
  progressData: UserProgress | null
  progressLoading: boolean
}

/**
 * Conteúdo que some da sidebar expandida (demandas + nível) em forma reduzida no header,
 * só quando a sidebar está retraída — altura contida, alinhado à esquerda.
 */
export function HeaderCollapsedSidebarTools({
  pendingTodosCount,
  progressData,
  progressLoading,
}: HeaderCollapsedSidebarToolsProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const navigate = useNavigate()
  const location = useLocation()
  const activeColor = theme.palette.primary.main
  const [levelMenuAnchor, setLevelMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
          flexShrink: 1,
          overflow: 'hidden',
          height: 1,
          maxHeight: 48,
        }}
      >
        <DemandCard count={pendingTodosCount} headerInline />
        <Tooltip title="Nível, conquistas e ajuda" placement="bottom">
          <Box
            component="button"
            type="button"
            onClick={(e) => setLevelMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.65,
              flexShrink: 0,
              maxHeight: 44,
              px: 0.85,
              py: 0.3,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              bgcolor: 'transparent',
              color: 'inherit',
              transition: 'border-color 0.15s, background-color 0.15s',
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                bgcolor: isLight ? 'rgba(124,58,237,0.05)' : 'rgba(167,139,250,0.08)',
              },
            }}
          >
            {progressLoading || !progressData ? (
              <Box sx={{ width: 72, py: 0.5 }}>
                <LinearProgress
                  color="secondary"
                  sx={{ borderRadius: 999, height: 3 }}
                />
              </Box>
            ) : (
              <>
                <TierBadge level={progressData.level} size="xs" showLevel />
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: getTierForLevel(progressData.level).color,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getTierForLevel(progressData.level).name}
                </Typography>
              </>
            )}
          </Box>
        </Tooltip>
      </Box>

      <MuiMenu
        anchorEl={levelMenuAnchor}
        open={Boolean(levelMenuAnchor)}
        onClose={() => setLevelMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              mt: 0.5,
              borderRadius: 2,
              boxShadow: theme.shadows[8],
            },
          },
        }}
      >
        {LEVEL_CARD_MENU_ITEMS.map((item) => {
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
  )
}
