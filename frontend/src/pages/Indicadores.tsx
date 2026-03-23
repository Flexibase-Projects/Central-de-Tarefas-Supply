import { useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material'
import {
  People,
  MessageCircleIcon,
  CheckCircle,
  List,
  Folder,
  ClipboardList,
} from '@/components/ui/icons'
import { useIndicators, type RecentAssignedTodo } from '@/hooks/use-indicators'
import { useAuth } from '@/contexts/AuthContext'

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  in_progress: 'Em progresso',
  review: 'Revisão',
  done: 'Concluído',
}

const tableCellCompact = { py: 0.6, px: 1.5, fontSize: '0.8125rem' } as const

function StatusChip({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status
  const color =
    status === 'done'
      ? 'success'
      : status === 'in_progress' || status === 'review'
        ? 'primary'
        : 'default'
  return <Chip size="small" label={label} color={color} variant="outlined" sx={{ height: 22 }} />
}

function TodoStatusChip({ completed }: { completed: boolean }) {
  return (
    <Chip
      size="small"
      label={completed ? 'Concluído' : 'Pendente'}
      color={completed ? 'success' : 'default'}
      variant={completed ? 'filled' : 'outlined'}
      sx={{ height: 22 }}
    />
  )
}

function BarChartRow({
  label,
  value,
  max,
  color = 'primary.main',
  showValue = true,
}: {
  label: string
  value: number
  max: number
  color?: string
  showValue?: boolean
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Typography variant="caption" sx={{ flexShrink: 0, width: 100, color: 'text.secondary' }} noWrap>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            width: `${pct}%`,
            bgcolor: color,
            borderRadius: 1,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
      {showValue && (
        <Typography variant="caption" fontWeight={600} sx={{ flexShrink: 0, minWidth: 24, textAlign: 'right' }}>
          {value}
        </Typography>
      )}
    </Box>
  )
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('pt-BR')
}

function getTodoScopeLabel(todo: RecentAssignedTodo) {
  if (todo.activityName) return `Atividade · ${todo.activityName}`
  if (todo.projectName) return `Projeto · ${todo.projectName}`
  return '—'
}

export default function Indicadores() {
  const { data, loading, error } = useIndicators()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')

  const personal = data?.personal
  const team = data?.team
  const byUser = data?.by_user ?? []
  const byProject = data?.by_project ?? []
  const byActivity = data?.by_activity ?? []
  const recentTodos = data?.recentAssignedTodos ?? []

  const userNameById = useMemo(() => {
    const map = new Map<string, string>()
    byUser.forEach((u) => map.set(u.user_id, u.name))
    return map
  }, [byUser])

  const todosAssignedTotal = personal?.todosAssignedTotal ?? 0
  const todosAssignedCompleted = personal?.todosAssignedCompleted ?? 0
  const todosAssignedOpen = personal?.todosAssignedOpen ?? Math.max(0, todosAssignedTotal - todosAssignedCompleted)
  const personalComments = personal?.commentsCount ?? 0
  const personalActivities = personal?.activitiesAssigned ?? 0

  const cardTodosCreated = isAdmin ? (team?.total_todos_created ?? 0) : todosAssignedTotal
  const cardTodosCompleted = isAdmin ? (team?.total_todos_completed ?? 0) : todosAssignedCompleted
  const cardComments = isAdmin ? (team?.total_comments ?? 0) : personalComments
  const cardActivities = isAdmin ? (team?.total_activities ?? 0) : personalActivities

  const maxTodosProject = Math.max(1, ...byProject.map((p) => p.todos_count))
  const maxTodosAssigned = Math.max(1, todosAssignedTotal, todosAssignedCompleted)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!data) {
    return null
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2.5 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        {isAdmin ? 'Indicadores do time' : 'Meus indicadores'}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(3, 1fr)',
            md: isAdmin ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)',
          },
          gap: 1.5,
          mb: 3,
        }}
      >
        {isAdmin && (
          <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                <People size={18} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Usuários
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {team?.total_users ?? 0}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <Folder size={18} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Projetos
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {team?.total_projects ?? 0}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <ClipboardList size={18} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isAdmin ? 'Atividades' : 'Minhas atividades'}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {cardActivities}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <MessageCircleIcon size={18} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isAdmin ? 'Comentários' : 'Meus comentários'}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {cardComments}
            </Typography>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            bgcolor: isAdmin ? 'background.paper' : 'rgba(37,99,235,0.06)',
            borderRadius: 2,
            borderColor: isAdmin ? 'divider' : 'primary.light',
          }}
        >
          <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <List size={18} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {isAdmin ? 'TO-DOs criados' : 'TO-DOs atribuídos'}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {cardTodosCreated}
            </Typography>
            {!isAdmin && (
              <Typography variant="caption" color="text.secondary">
                {todosAssignedOpen} pendentes
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 2 }}>
          <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <CheckCircle size={18} />
              <Typography variant="caption" sx={{ opacity: 0.95 }} fontWeight={600}>
                {isAdmin ? 'TO-DOs concluídos' : 'TO-DOs concluídos'}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>
              {cardTodosCompleted}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {(cardTodosCreated > 0 || cardTodosCompleted > 0) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
            {isAdmin ? 'TO-DOs do time' : 'Meus TO-DOs'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <BarChartRow
              label={isAdmin ? 'Criados' : 'Atribuídos'}
              value={cardTodosCreated}
              max={maxTodosAssigned}
              color="primary.main"
            />
            <BarChartRow
              label="Concluídos"
              value={cardTodosCompleted}
              max={maxTodosAssigned}
              color="success.main"
            />
          </Box>
        </Paper>
      )}

      <Divider sx={{ my: 2 }} />

      {isAdmin ? (
        <>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
            Por usuário
          </Typography>
          <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover', '& .MuiTableCell-head': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Usuário</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>Coment.</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>TO-DOs criados</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>TO-DOs concl.</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>Ativ. criadas</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>Ativ. atrib.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byUser.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ ...tableCellCompact, py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhum usuário com acesso ao sistema.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    byUser.map((u, idx) => (
                      <TableRow key={u.user_id} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover' }}>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} display="block">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={tableCellCompact}>{u.comments_count}</TableCell>
                        <TableCell align="right" sx={tableCellCompact}>{u.todos_created}</TableCell>
                        <TableCell align="right" sx={tableCellCompact}>
                          <Typography component="span" color="success.main" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                            {u.todos_completed}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={tableCellCompact}>{u.activities_created}</TableCell>
                        <TableCell align="right" sx={tableCellCompact}>{u.activities_assigned}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            {byUser.length > 0 && (
              <Box sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                  TO-DOs criados por usuário
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {byUser.slice(0, 8).map((u) => (
                    <BarChartRow
                      key={u.user_id}
                      label={u.name}
                      value={u.todos_created + u.todos_completed}
                      max={Math.max(1, ...byUser.map((item) => item.todos_created + item.todos_completed))}
                      color="primary.main"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
          <Divider sx={{ my: 2 }} />
        </>
      ) : (
        <>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
            Últimos to-dos atribuídos
          </Typography>
          <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover', '& .MuiTableCell-head': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>TO-DO</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Origem</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Atribuído em</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Prazo</TableCell>
                    <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>XP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTodos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ ...tableCellCompact, py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhum to-do foi atribuído a você ainda.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTodos.map((todo: RecentAssignedTodo, idx: number) => (
                      <TableRow key={todo.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover' }}>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
                            {todo.title}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }} noWrap>
                            {getTodoScopeLabel(todo)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <TodoStatusChip completed={todo.completed} />
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {formatDate(todo.assignedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {formatDate(todo.deadline)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={tableCellCompact}>
                          <Typography component="span" color="primary.main" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                            {todo.xpReward}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
        Por projeto
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover', '& .MuiTableCell-head': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Projeto</TableCell>
                <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>TO-DOs</TableCell>
                <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>Concluídos</TableCell>
                <TableCell align="right" sx={{ ...tableCellCompact, fontWeight: 600 }}>Coment.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {byProject.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ ...tableCellCompact, py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {isAdmin ? 'Nenhum projeto cadastrado.' : 'Nenhum projeto com to-dos atribuídos.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                byProject.map((p, idx) => (
                  <TableRow key={p.project_id} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover' }}>
                    <TableCell sx={tableCellCompact}>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
                        {p.project_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tableCellCompact}>
                      <StatusChip status={p.project_status} />
                    </TableCell>
                    <TableCell align="right" sx={tableCellCompact}>
                      {p.todos_count}
                    </TableCell>
                    <TableCell align="right" sx={tableCellCompact}>
                      <Typography component="span" color="success.main" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                        {p.todos_completed}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={tableCellCompact}>
                      {p.comments_count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        {byProject.length > 0 && (
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
              TO-DOs por projeto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {byProject.slice(0, 10).map((p) => (
                <BarChartRow
                  key={p.project_id}
                  label={p.project_name}
                  value={p.todos_count}
                  max={maxTodosProject}
                  color="primary.main"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {isAdmin && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
            Atividades
          </Typography>
          <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover', '& .MuiTableCell-head': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Atividade</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Atribuído a</TableCell>
                    <TableCell sx={{ ...tableCellCompact, fontWeight: 600 }}>Prazo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byActivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ ...tableCellCompact, py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma atividade cadastrada.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    byActivity.map((a, idx) => (
                      <TableRow key={a.activity_id} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'action.hover' }}>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8125rem' }}>
                            {a.activity_name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <StatusChip status={a.status} />
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {a.assigned_to ? userNameById.get(a.assigned_to) ?? '—' : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableCellCompact}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {a.due_date ? new Date(a.due_date).toLocaleDateString('pt-BR') : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  )
}
