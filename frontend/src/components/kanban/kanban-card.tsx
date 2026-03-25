import { useEffect, useState } from 'react'
import { Project } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, Box, Typography, useTheme, Chip } from '@mui/material'
import { usePermissions } from '@/hooks/use-permissions'
import { getApiBase } from '@/lib/api'
import type { ProjectTodoCardSummary } from '@/hooks/use-project-todo-card-summary'

interface KanbanCardProps {
  project: Project
  onClick?: () => void
  summary?: ProjectTodoCardSummary | null
}

const STATUS_STRIPE: Record<string, string> = {
  backlog: '#94A3B8',
  todo: '#2563EB',
  in_progress: '#D97706',
  review: '#7C3AED',
  done: '#059669',
}

export function KanbanCard({ project, onClick, summary }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const { hasRole } = usePermissions()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    if (!project.project_url) {
      setOnline(null)
      return
    }
    const base = getApiBase()
    const url = base
      ? `${base}/api/projects/health-check?url=${encodeURIComponent(project.project_url)}`
      : `/api/projects/health-check?url=${encodeURIComponent(project.project_url)}`
    fetch(url)
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((d) => setOnline(d.ok === true))
      .catch(() => setOnline(false))
  }, [project.project_url])

  const isAdmin = hasRole('admin')
  const assignedCount = Math.max(0, Number(summary?.myAssignedOpenCount ?? 0))
  const totalOpenCount = Math.max(0, Number(summary?.totalOpenCount ?? 0))
  const xpPendingCount = Math.max(0, Number(summary?.xpPendingCount ?? 0))
  const activeCount = Math.max(assignedCount, isAdmin ? xpPendingCount : 0)
  const focusBg = isAdmin && xpPendingCount > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(37,99,235,0.08)'
  const focusBorder = isAdmin && xpPendingCount > 0 ? 'rgba(245,158,11,0.22)' : 'rgba(37,99,235,0.22)'
  const style = { transform: CSS.Transform.toString(transform), transition }
  const stripeColor = STATUS_STRIPE[project.status] || STATUS_STRIPE.backlog
  const dotColor = !project.project_url ? '#94A3B8' : online === true ? '#059669' : online === false ? '#EF4444' : '#94A3B8'
  const hasCover = Boolean(project.cover_image_url)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      variant="outlined"
      sx={{
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        position: 'relative',
        border: `1px solid ${activeCount > 0 ? focusBorder : theme.palette.divider}`,
        opacity: isDragging ? 0.45 : 1,
        bgcolor: isLight ? 'background.paper' : 'rgba(255,255,255,0.02)',
        color: 'text.primary',
        overflow: 'hidden',
        boxShadow: isLight
          ? '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.03)'
          : '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
        ...(activeCount > 0 && { background: focusBg }),
      }}
    >
      {hasCover && (
        <Box
          sx={{
            width: '100%',
            height: 96,
            backgroundImage: `url(${project.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        />
      )}

      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: hasCover ? 96 : 0,
          bottom: 0,
          width: 3,
          bgcolor: stripeColor,
          borderRadius: hasCover ? 0 : '8px 0 0 8px',
        }}
      />

      <CardContent sx={{ pl: 2.5, py: 1.5, pr: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Box
            sx={{
              flexShrink: 0,
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: dotColor,
              border: `1.5px solid ${theme.palette.background.paper}`,
            }}
            title={
              project.project_url
                ? online === true ? 'Online' : online === false ? 'Offline' : 'Verificando...'
                : 'Link não configurado'
            }
          />
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0, fontSize: 13 }}>
            {project.name}
          </Typography>
        </Box>

        {project.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              fontSize: 12,
            }}
          >
            {project.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap', minWidth: 0 }}>
            <Chip
              size="small"
              label={`Demandas totais: ${totalOpenCount}`}
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: totalOpenCount > 0 ? 'rgba(15,23,42,0.08)' : 'rgba(100,116,139,0.08)',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: totalOpenCount > 0 ? 'rgba(15,23,42,0.15)' : 'rgba(100,116,139,0.16)',
                '& .MuiChip-label': { px: 0.75 },
                maxWidth: 140,
              }}
            />
            <Chip
              size="small"
              label={`Suas demandas: ${assignedCount}`}
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: assignedCount > 0 ? 'rgba(37,99,235,0.12)' : 'rgba(100,116,139,0.08)',
                color: assignedCount > 0 ? '#1D4ED8' : '#64748B',
                border: '1px solid',
                borderColor: assignedCount > 0 ? 'rgba(37,99,235,0.22)' : 'rgba(100,116,139,0.16)',
                '& .MuiChip-label': { px: 0.75 },
                display: assignedCount > 0 ? 'inline-flex' : 'none',
                maxWidth: 130,
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
