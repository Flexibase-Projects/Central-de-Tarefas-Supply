import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || ''

export interface IndicatorsTeamTotals {
  total_users: number
  total_projects: number
  total_activities: number
  total_comments: number
  total_todos_created: number
  total_todos_completed: number
}

export interface IndicatorsUserRow {
  user_id: string
  name: string
  email: string
  avatar_url: string | null
  comments_count: number
  todos_created: number
  todos_completed: number
  activities_created: number
  activities_assigned: number
}

export interface IndicatorsProjectRow {
  project_id: string
  project_name: string
  project_status: string
  todos_count: number
  todos_completed: number
  comments_count: number
}

export interface IndicatorsActivityRow {
  activity_id: string
  activity_name: string
  status: string
  assigned_to: string | null
  due_date: string | null
}

export interface RecentActivity {
  id: string
  name: string
  status: string
  dueDate: string | null
  updatedAt: string | null
}

export interface IndicatorsPersonalSummary {
  commentsCount: number
  todosAssignedTotal: number
  todosAssignedCompleted: number
  todosAssignedOpen: number
  activitiesAssigned: number
}

export interface RecentAssignedTodo {
  id: string
  title: string
  completed: boolean
  assignedAt: string | null
  deadline: string | null
  projectName: string | null
  activityName: string | null
  xpReward: number
  projectId?: string | null
  activityId?: string | null
  assigneeName?: string | null
}

export interface IndicatorsViewData {
  scope: 'team' | 'me'
  team: IndicatorsTeamTotals
  personal: IndicatorsPersonalSummary
  recentAssignedTodos: RecentAssignedTodo[]
  pendingAssignedTodos: RecentAssignedTodo[]
  recentActivities: RecentActivity[]
  by_user: IndicatorsUserRow[]
  by_project: IndicatorsProjectRow[]
  by_activity: IndicatorsActivityRow[]
}

type IndicatorsResponse = Partial<IndicatorsViewData> & {
  scope?: 'team' | 'me'
}

type RawPersonalSummary = {
  commentsCount?: number
  todosAssignedTotal?: number
  todosAssignedCompleted?: number
  todosAssignedOpen?: number
  activitiesAssigned?: number
}

type RawRecentTodo = Partial<RecentAssignedTodo>
type RawRecentActivity = Partial<RecentActivity>

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeTeamTotals(raw: Partial<IndicatorsTeamTotals> | undefined): IndicatorsTeamTotals {
  return {
    total_users: toNumber(raw?.total_users, 0),
    total_projects: toNumber(raw?.total_projects, 0),
    total_activities: toNumber(raw?.total_activities, 0),
    total_comments: toNumber(raw?.total_comments, 0),
    total_todos_created: toNumber(raw?.total_todos_created, 0),
    total_todos_completed: toNumber(raw?.total_todos_completed, 0),
  }
}

function normalizePersonalSummary(
  raw: RawPersonalSummary | undefined,
  fallbackUserRow: IndicatorsUserRow | null,
): IndicatorsPersonalSummary {
  if (raw) {
    return {
      commentsCount: toNumber(raw.commentsCount, 0),
      todosAssignedTotal: toNumber(raw.todosAssignedTotal, 0),
      todosAssignedCompleted: toNumber(raw.todosAssignedCompleted, 0),
      todosAssignedOpen: toNumber(raw.todosAssignedOpen, 0),
      activitiesAssigned: toNumber(raw.activitiesAssigned, 0),
    }
  }

  if (fallbackUserRow) {
    const completed = toNumber(fallbackUserRow.todos_completed, 0)
    const created = toNumber(fallbackUserRow.todos_created, 0)
    const total = Math.max(created, completed)
    return {
      commentsCount: toNumber(fallbackUserRow.comments_count, 0),
      todosAssignedTotal: total,
      todosAssignedCompleted: completed,
      todosAssignedOpen: Math.max(0, total - completed),
      activitiesAssigned: toNumber(fallbackUserRow.activities_assigned, 0),
    }
  }

  return {
    commentsCount: 0,
    todosAssignedTotal: 0,
    todosAssignedCompleted: 0,
    todosAssignedOpen: 0,
    activitiesAssigned: 0,
  }
}

function normalizeRecentAssignedTodos(raw: unknown): RecentAssignedTodo[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): RecentAssignedTodo | null => {
      if (!item || typeof item !== 'object') return null
      const row = item as RawRecentTodo
      const id = typeof row.id === 'string' ? row.id : ''
      if (!id) return null
      return {
        id,
        title: typeof row.title === 'string' ? row.title : 'TO-DO',
        completed: Boolean(row.completed),
        assignedAt: typeof row.assignedAt === 'string' ? row.assignedAt : null,
        deadline: typeof row.deadline === 'string' ? row.deadline : null,
        projectName: typeof row.projectName === 'string' ? row.projectName : null,
        activityName: typeof row.activityName === 'string' ? row.activityName : null,
        xpReward: toNumber(row.xpReward, 0),
        projectId: typeof row.projectId === 'string' ? row.projectId : null,
        activityId: typeof row.activityId === 'string' ? row.activityId : null,
        assigneeName: typeof row.assigneeName === 'string' ? row.assigneeName : null,
      }
    })
    .filter((item): item is RecentAssignedTodo => item !== null)
}

function normalizeRecentActivities(raw: unknown): RecentActivity[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): RecentActivity | null => {
      if (!item || typeof item !== 'object') return null
      const row = item as RawRecentActivity
      const id = typeof row.id === 'string' ? row.id : ''
      if (!id) return null
      return {
        id,
        name: typeof row.name === 'string' ? row.name : 'Atividade',
        status: typeof row.status === 'string' ? row.status : 'backlog',
        dueDate: typeof row.dueDate === 'string' ? row.dueDate : null,
        updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
      }
    })
    .filter((item): item is RecentActivity => item !== null)
}

function normalizeIndicatorsResponse(
  raw: unknown,
  isAdmin: boolean,
  currentUserId: string | null,
): IndicatorsViewData | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as IndicatorsResponse
  const byUser = Array.isArray(data.by_user) ? data.by_user : []
  const fallbackUserRow =
    currentUserId && byUser.length > 0
      ? byUser.find((row) => row.user_id === currentUserId) ?? null
      : null

  const personal = normalizePersonalSummary(
    data.personal as RawPersonalSummary | undefined,
    fallbackUserRow,
  )

  return {
    scope: data.scope ?? (isAdmin ? 'team' : 'me'),
    team: normalizeTeamTotals(data.team),
    personal,
    recentAssignedTodos: normalizeRecentAssignedTodos(data.recentAssignedTodos),
    pendingAssignedTodos: normalizeRecentAssignedTodos((data as Record<string, unknown>).pendingAssignedTodos),
    recentActivities: normalizeRecentActivities((data as Record<string, unknown>).recentActivities),
    by_user: byUser,
    by_project: Array.isArray(data.by_project) ? data.by_project : [],
    by_activity: Array.isArray(data.by_activity) ? data.by_activity : [],
  }
}

export function useIndicators() {
  const { getAuthHeaders, hasRole, currentUser } = useAuth()
  const [data, setData] = useState<IndicatorsViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = hasRole('admin')

  const fetchIndicators = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('scope', isAdmin ? 'team' : 'me')
      const url = API_URL
        ? `${API_URL}/api/indicators?${params.toString()}`
        : `/api/indicators?${params.toString()}`
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/6d92a057-afdb-40f1-aa90-bc667d0d8da8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d3f9fe'},body:JSON.stringify({sessionId:'d3f9fe',runId:'pre-fix',hypothesisId:'H5',location:'frontend/src/hooks/use-indicators.ts:246',message:'frontend indicators request',data:{url,isAdmin,currentUserId:currentUser?.id??null,hasAuthorizationHeader:Boolean(getAuthHeaders().Authorization),xUserId:getAuthHeaders()['x-user-id']??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, { headers: getAuthHeaders() })
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/6d92a057-afdb-40f1-aa90-bc667d0d8da8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d3f9fe'},body:JSON.stringify({sessionId:'d3f9fe',runId:'pre-fix',hypothesisId:'H5',location:'frontend/src/hooks/use-indicators.ts:248',message:'frontend indicators response status',data:{status:response.status,ok:response.ok},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (!response.ok) {
        if (response.status === 401) {
          setData(null)
          return
        }
        throw new Error('Falha ao carregar indicadores')
      }
      const json = await response.json()
      const normalized = normalizeIndicatorsResponse(json, isAdmin, currentUser?.id ?? null)
      setData(normalized)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar indicadores'
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, isAdmin, currentUser?.id])

  useEffect(() => {
    void fetchIndicators()
  }, [fetchIndicators])

  return { data, loading, error, refresh: fetchIndicators }
}
