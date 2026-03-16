import { Tooltip, Box, Typography } from '@mui/material'
import { getTierForLevel } from '@/utils/tier'

// Colour map keyed by the tier cssClass names already defined in tier.ts.
// These supplement the existing TierInfo with bg/text/border suitable for
// a small inline pill rendered in MUI (no external CSS class needed).
const TIER_PILL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'tier-cobalt':    { bg: 'rgba(148,163,184,0.15)', text: '#64748B', border: 'rgba(148,163,184,0.4)' },
  'tier-uranium':   { bg: 'rgba(57,255,20,0.12)',   text: '#16A34A', border: 'rgba(57,255,20,0.35)'  },
  'tier-platinum':  { bg: 'rgba(229,228,226,0.15)', text: '#94A3B8', border: 'rgba(229,228,226,0.5)' },
  'tier-flexibase': { bg: 'rgba(0,191,255,0.12)',   text: '#0EA5E9', border: 'rgba(0,191,255,0.4)'   },
}

const FALLBACK_PILL = { bg: 'rgba(148,163,184,0.15)', text: '#64748B', border: 'rgba(148,163,184,0.4)' }

const SIZE_METRICS = {
  xs: { fontSize: 9,  height: 16, px: '4px',  py: '1px'  },
  sm: { fontSize: 10, height: 18, px: '6px',  py: '2px'  },
  md: { fontSize: 12, height: 20, px: '8px',  py: '2px'  },
  lg: { fontSize: 13, height: 24, px: '10px', py: '3px'  },
}

interface TierBadgeProps {
  level: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** When true show "Tier Name" instead of "Nv. N". Defaults to false. */
  showTierName?: boolean
  /** When false, only tier name is shown. Default: true */
  showLevel?: boolean
}

export function TierBadge({
  level,
  size = 'sm',
  showTierName = false,
  showLevel = true,
}: TierBadgeProps) {
  const tier = getTierForLevel(level)
  const pill = TIER_PILL_STYLE[tier.cssClass] ?? FALLBACK_PILL
  const m = SIZE_METRICS[size]

  const label = showTierName
    ? tier.name
    : showLevel
      ? `Nv. ${level}`
      : tier.name

  return (
    <Tooltip title={`${tier.name} — Nível ${level}`} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: m.height,
          px: m.px,
          py: m.py,
          borderRadius: '999px',
          bgcolor: pill.bg,
          color: pill.text,
          border: `1px solid ${pill.border}`,
          cursor: 'default',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: m.fontSize,
            fontWeight: 700,
            lineHeight: 1,
            color: 'inherit',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  )
}
