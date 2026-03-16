import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { BarChart2, CheckSquare, CheckCircle, Calendar } from '@/components/ui/icons';

interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trend?: string
  trendUp?: boolean
}

function MetricCard({ label, value, icon: Icon, iconColor, iconBg, trend, trendUp }: MetricCardProps) {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  return (
    <Card
      variant="outlined"
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: iconBg,
              flexShrink: 0,
            }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </Box>
          {trend && (
            <Box
              sx={{
                px: 0.875,
                py: 0.25,
                borderRadius: 999,
                bgcolor: trendUp
                  ? isLight ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.12)'
                  : isLight ? 'rgba(220,38,38,0.1)' : 'rgba(248,113,113,0.12)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: 11,
                  color: trendUp
                    ? isLight ? '#059669' : '#34D399'
                    : isLight ? '#DC2626' : '#F87171',
                }}
              >
                {trendUp ? '↑' : '↓'} {trend}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h3" fontWeight={700} sx={{ mb: 0.25, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  const metrics = [
    {
      label: 'Projetos Ativos',
      value: '—',
      icon: BarChart2,
      iconColor: theme.palette.primary.main,
      iconBg: isLight ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.15)',
    },
    {
      label: 'Tarefas em Andamento',
      value: '—',
      icon: Calendar,
      iconColor: isLight ? '#D97706' : '#FBBF24',
      iconBg: isLight ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.12)',
    },
    {
      label: 'Próximas Revisões',
      value: '—',
      icon: CheckSquare,
      iconColor: isLight ? '#7C3AED' : '#A78BFA',
      iconBg: isLight ? 'rgba(124,58,237,0.1)' : 'rgba(167,139,250,0.12)',
    },
    {
      label: 'Concluídos',
      value: '—',
      icon: CheckCircle,
      iconColor: isLight ? '#059669' : '#34D399',
      iconBg: isLight ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.12)',
    },
  ]

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.25 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral dos seus projetos e atividades
        </Typography>
      </Box>

      {/* Metric cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </Box>
    </Box>
  )
}
