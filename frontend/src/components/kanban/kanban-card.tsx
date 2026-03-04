import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { CheckCircle, Warning, Help, Person, CheckBox } from '@mui/icons-material';

function GitHubIconSmall() {
  const size = 12;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} style={{ display: 'block' }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
import { useGitHub } from '@/hooks/use-github';
import { useTodos } from '@/hooks/use-todos';
import { useUsersList } from '@/hooks/use-users-list';
import { getApiBase } from '@/lib/api';

interface KanbanCardProps {
  project: Project;
  onClick?: () => void;
}

// Paleta mínima: barra lateral fina por status (tons suaves)
const STATUS_STRIPE: Record<string, string> = {
  backlog: '#94a3b8',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#10b981',
};

export function KanbanCard({ project, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const { getCommitsCount } = useGitHub();
  const { todos } = useTodos(project.id);
  const { users } = useUsersList();
  const [commitsCount, setCommitsCount] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [versionCheck, setVersionCheck] = useState<{
    upToDate: boolean | null;
    loading: boolean;
    reason?: string;
  }>({ upToDate: null, loading: false });

  useEffect(() => {
    if (project.github_url) {
      getCommitsCount(project.github_url)
        .then(setCommitsCount)
        .catch(() => setCommitsCount(0));
    } else {
      setCommitsCount(0);
    }
  }, [project.github_url, getCommitsCount]);

  useEffect(() => {
    if (!project.project_url) {
      setOnline(null);
      return;
    }
    const base = getApiBase();
    const url = base
      ? `${base}/api/projects/health-check?url=${encodeURIComponent(project.project_url)}`
      : `/api/projects/health-check?url=${encodeURIComponent(project.project_url)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((d) => setOnline(d.ok === true))
      .catch(() => setOnline(false));
  }, [project.project_url]);

  useEffect(() => {
    if (!project.project_url || !project.github_url) {
      setVersionCheck({ upToDate: null, loading: false });
      return;
    }
    setVersionCheck((v) => ({ ...v, loading: true }));
    const base = getApiBase();
    const url = base
      ? `${base}/api/projects/version-check?projectUrl=${encodeURIComponent(project.project_url)}&githubUrl=${encodeURIComponent(project.github_url)}`
      : `/api/projects/version-check?projectUrl=${encodeURIComponent(project.project_url)}&githubUrl=${encodeURIComponent(project.github_url)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { upToDate?: boolean | null; reason?: string }) =>
        setVersionCheck({ upToDate: d.upToDate ?? null, loading: false, reason: d.reason })
      )
      .catch(() => setVersionCheck({ upToDate: null, loading: false, reason: 'fetch_error' }));
  }, [project.project_url, project.github_url]);

  const pendingTodos = todos.filter((t) => !t.completed);
  const todosByAssignee = pendingTodos.reduce(
    (acc, todo) => {
      const id = todo.assigned_to || 'unassigned';
      if (!acc[id]) acc[id] = [];
      acc[id].push(todo);
      return acc;
    },
    {} as Record<string, typeof pendingTodos>
  );
  const assigneesWithCounts = Object.entries(todosByAssignee)
    .map(([assigneeId, list]) => {
      const user = assigneeId !== 'unassigned' ? users.find((u) => u.id === assigneeId) : null;
      return { assigneeId, count: list.length, userName: user?.name || 'Sem responsável' };
    })
    .sort((a, b) => b.count - a.count);

  const style = { transform: CSS.Transform.toString(transform), transition };
  const displayNumber = commitsCount !== null ? commitsCount : 0;
  const stripeColor = STATUS_STRIPE[project.status] || STATUS_STRIPE.backlog;

  const dotColor =
    !project.project_url ? '#cbd5e1' : online === true ? '#10b981' : online === false ? '#ef4444' : '#cbd5e1';

  const versionTitle =
    versionCheck.reason === 'timeout'
      ? 'Timeout ao acessar o site.'
      : versionCheck.reason === 'no_version_found'
        ? 'Nenhuma versão encontrada na página.'
        : versionCheck.reason === 'fetch_error'
          ? 'Erro ao acessar o site.'
          : 'Não foi possível validar a versão';

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
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        opacity: isDragging ? 0.5 : 1,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: 'action.selected',
        },
        overflow: 'visible',
      }}
    >
      {/* Barra de status (indicador visual discreto) */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: stripeColor,
          borderRadius: '8px 0 0 8px',
        }}
      />
      {/* Indicador online/offline */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 14,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: dotColor,
          border: '1.5px solid',
          borderColor: 'background.paper',
          boxShadow: 1,
          zIndex: 1,
        }}
        title={
          project.project_url
            ? online === true
              ? 'Online'
              : online === false
                ? 'Offline'
                : 'Verificando...'
            : 'Link não configurado'
        }
      />
      {/* Badge commits (discreto) */}
      {project.github_url && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            height: 20,
            px: 1,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
            <GitHubIconSmall />
          </Box>
          <Typography component="span" variant="caption" fontWeight={600} sx={{ fontSize: 11, lineHeight: 1 }}>
            {commitsCount !== null ? String(displayNumber).padStart(2, '0') : '--'}
          </Typography>
        </Box>
      )}
      <CardContent sx={{ pl: 2.5, py: 1.5, pr: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ pr: project.github_url ? 5 : 0 }}>
          {project.name}
        </Typography>
        {project.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
            }}
          >
            {project.description}
          </Typography>
        )}
        {project.project_url && project.github_url && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {versionCheck.loading ? (
              <Typography variant="caption" color="text.secondary">
                Verificando versão...
              </Typography>
            ) : versionCheck.upToDate === true ? (
              <>
                <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography variant="caption" color="text.secondary">
                  Atualizado
                </Typography>
              </>
            ) : versionCheck.upToDate === false ? (
              <>
                <Warning sx={{ fontSize: 14, color: '#f59e0b' }} />
                <Typography variant="caption" color="text.secondary">
                  Desatualizado
                </Typography>
              </>
            ) : (
              <>
                <Help sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" title={versionTitle}>
                  Versão não verificada
                </Typography>
              </>
            )}
          </Box>
        )}
        {pendingTodos.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            {assigneesWithCounts.map((a) => (
              <Box
                key={a.assigneeId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CheckBox sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {a.count} pendente{a.count !== 1 ? 's' : ''}
                </Typography>
                <Person sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {a.userName}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
