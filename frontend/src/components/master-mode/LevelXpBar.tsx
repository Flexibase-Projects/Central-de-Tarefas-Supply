import { Box, LinearProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material'
import type { UserProgress } from '@/types'
import { getTierForLevel } from '@/utils/tier'
import { TierBadge } from '@/components/gamification/TierBadge'

interface LevelXpBarProps {
  progress: UserProgress | null
  loading?: boolean
  compact?: boolean
}

function getTierBarGradient(tierName: string, primaryColor: string): string {
  switch (tierName) {
    case 'Uranium':
      return 'linear-gradient(90deg, #39FF14 0%, #00CC00 100%)'
    case 'Platinum':
      return 'linear-gradient(90deg, #E5E4E2 0%, #BFC1C2 100%)'
    case 'FlexiBase':
      return 'linear-gradient(90deg, #00BFFF 0%, #0099CC 100%)'
    case 'Cobalt':
    default:
      return `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 100%)`
  }
}

export function LevelXpBar({ progress, loading, compact }: LevelXpBarProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  if (loading || !progress) {
    return (
      <Box sx={{ width: '100%', py: compact ? 0.25 : 0.75 }}>
        <LinearProgress
          color="secondary"
          sx={{ borderRadius: 999, height: compact ? 3 : 5 }}
        />
      </Box>
    )
  }

  const { level, xpInCurrentLevel, xpForNextLevel } = progress
  const percent = xpForNextLevel > 0 ? Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100) : 0
  const tier = getTierForLevel(level)
  const barGradient = getTierBarGradient(tier.name, theme.palette.primary.main)

  return (
    <Box sx={{ width: '100%', py: compact ? 0.25 : 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.25 : 0.5 }}>
        {/* Level badge with tier */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TierBadge level={level} size={compact ? 'xs' : 'sm'} showLevel={true} />
          {!compact && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: 10,
                color: tier.color,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {tier.name}
            </Typography>
          )}
        </Box>
        {!compact && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
            {xpInCurrentLevel} / {xpForNextLevel} XP
          </Typography>
        )}
      </Box>

      {/* XP progress bar */}
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          borderRadius: 999,
          height: compact ? 3 : 5,
          bgcolor: isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.12)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            background: barGradient,
            transition: 'transform 0.6s ease-out',
          },
        }}
      />
    </Box>
  )
}
