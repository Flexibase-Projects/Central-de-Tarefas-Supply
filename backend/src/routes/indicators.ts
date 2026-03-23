import express from 'express';
import { supabase } from '../config/supabase.js';
import { hasRole } from '../services/permissions.js';
import { isSupabaseConnectionRefused, SUPABASE_UNAVAILABLE_MESSAGE } from '../utils/supabase-errors.js';

const router = express.Router();

type ScopeMode = 'team' | 'me';

interface UserIndicator {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  comments_count: number;
  todos_created: number;
  todos_completed: number;
  activities_created: number;
  activities_assigned: number;
}

interface ProjectIndicator {
  project_id: string;
  project_name: string;
  project_status: string;
  todos_count: number;
  todos_completed: number;
  comments_count: number;
}

interface ActivityIndicator {
  activity_id: string;
  activity_name: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
}

interface TeamTotals {
  total_users: number;
  total_projects: number;
  total_activities: number;
  total_comments: number;
  total_todos_created: number;
  total_todos_completed: number;
}

interface PersonalSummary {
  todosAssignedTotal: number;
  todosAssignedCompleted: number;
  todosAssignedOpen: number;
  commentsCount: number;
  activitiesAssigned: number;
}

interface RecentAssignedTodo {
  id: string;
  title: string;
  completed: boolean;
  assignedAt: string | null;
  deadline: string | null;
  projectName: string | null;
  activityName: string | null;
  xpReward: number | null;
  projectId: string | null;
  activityId: string | null;
}

type TodoRow = {
  id: string;
  project_id: string | null;
  activity_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  completed: boolean | null;
  assigned_at?: string | null;
  updated_at: string | null;
  created_at: string;
  deadline: string | null;
  xp_reward: number | null;
  title: string;
};

type CommentRow = {
  id: string;
  created_by: string | null;
  project_id: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  priority_order?: number | null;
  created_at: string;
};

type ActivityRow = {
  id: string;
  name: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
};

function getRequesterId(req: express.Request): string | null {
  return (
    ((req as express.Request & { userId?: string }).userId ?? null) ||
    (req.headers['x-user-id'] as string | undefined) ||
    null
  );
}

function parseScope(scope: unknown): ScopeMode | null {
  if (scope === 'team' || scope === 'me') return scope;
  return null;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function dateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchUsers() {
  const { data, error } = await supabase
    .from('cdt_users')
    .select('id, name, email, avatar_url')
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string; email: string; avatar_url: string | null }>;
}

async function fetchProjects() {
  const baseQuery = supabase.from('cdt_projects').select('id, name, status, priority_order, created_at');
  const orderedQuery = await baseQuery
    .order('priority_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (orderedQuery.error && /priority_order|does not exist|column.*not exist/i.test(String(orderedQuery.error.message || ''))) {
    const fallback = await supabase
      .from('cdt_projects')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []) as ProjectRow[];
  }

  if (orderedQuery.error) throw orderedQuery.error;
  return (orderedQuery.data ?? []) as ProjectRow[];
}

async function fetchTodosForIndicators() {
  const withAssignedAt = await supabase
    .from('cdt_project_todos')
    .select('id, title, project_id, activity_id, created_by, assigned_to, completed, assigned_at, updated_at, created_at, deadline, xp_reward');

  if (withAssignedAt.error && /assigned_at|does not exist|column.*not exist/i.test(String(withAssignedAt.error.message || ''))) {
    const fallback = await supabase
      .from('cdt_project_todos')
      .select('id, title, project_id, activity_id, created_by, assigned_to, completed, updated_at, created_at, deadline, xp_reward');
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []) as TodoRow[];
  }

  if (withAssignedAt.error) throw withAssignedAt.error;
  return (withAssignedAt.data ?? []) as TodoRow[];
}

function buildProjectIndicators(params: {
  projects: ProjectRow[];
  todos: TodoRow[];
  comments: CommentRow[];
  scope: ScopeMode;
  currentUserId: string;
}): ProjectIndicator[] {
  const { projects, todos, comments, scope, currentUserId } = params;
  const todosByProject = new Map<string, { total: number; completed: number }>();
  const commentsByProject = new Map<string, number>();

  if (scope === 'me') {
    const userTodos = todos.filter((todo) => todo.assigned_to === currentUserId && todo.project_id);
    const userComments = comments.filter((comment) => comment.created_by === currentUserId && comment.project_id);

    for (const todo of userTodos) {
      const projectId = todo.project_id as string;
      const current = todosByProject.get(projectId) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (todo.completed) current.completed += 1;
      todosByProject.set(projectId, current);
    }

    for (const comment of userComments) {
      const projectId = comment.project_id as string;
      commentsByProject.set(projectId, (commentsByProject.get(projectId) ?? 0) + 1);
    }
  } else {
    for (const todo of todos) {
      if (!todo.project_id) continue;
      const current = todosByProject.get(todo.project_id) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (todo.completed) current.completed += 1;
      todosByProject.set(todo.project_id, current);
    }

    for (const comment of comments) {
      if (!comment.project_id) continue;
      commentsByProject.set(comment.project_id, (commentsByProject.get(comment.project_id) ?? 0) + 1);
    }
  }

  return projects
    .filter((project) => scope === 'team' || todosByProject.has(project.id))
    .map((project) => {
      const totals = todosByProject.get(project.id) ?? { total: 0, completed: 0 };
      return {
        project_id: project.id,
        project_name: project.name,
        project_status: project.status,
        todos_count: totals.total,
        todos_completed: totals.completed,
        comments_count: commentsByProject.get(project.id) ?? 0,
      };
    });
}

function buildActivityIndicators(params: {
  activities: ActivityRow[];
  scope: ScopeMode;
  currentUserId: string;
}): ActivityIndicator[] {
  const { activities, scope, currentUserId } = params;
  const source = scope === 'me'
    ? activities.filter((activity) => activity.assigned_to === currentUserId)
    : activities;

  return source.map((activity) => ({
    activity_id: activity.id,
    activity_name: activity.name,
    status: activity.status,
    assigned_to: activity.assigned_to ?? null,
    due_date: activity.due_date ?? null,
  }));
}

function buildRecentAssignedTodos(params: {
  todos: TodoRow[];
  projects: ProjectRow[];
  activities: ActivityRow[];
  currentUserId: string;
}): RecentAssignedTodo[] {
  const { todos, projects, activities, currentUserId } = params;
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const activityNameById = new Map(activities.map((activity) => [activity.id, activity.name]));

  return [...todos]
    .filter((todo) => todo.assigned_to === currentUserId)
    .sort((a, b) => {
      const bValue = dateValue(b.assigned_at ?? b.updated_at ?? b.created_at);
      const aValue = dateValue(a.assigned_at ?? a.updated_at ?? a.created_at);
      return bValue - aValue;
    })
    .slice(0, 10)
    .map((todo) => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed === true,
      assignedAt: todo.assigned_at ?? null,
      deadline: todo.deadline ?? null,
      projectName: todo.project_id ? projectNameById.get(todo.project_id) ?? null : null,
      activityName: todo.activity_id ? activityNameById.get(todo.activity_id) ?? null : null,
      xpReward: todo.xp_reward ?? null,
      projectId: todo.project_id,
      activityId: todo.activity_id,
    }));
}

function buildPersonalSummary(params: {
  todos: TodoRow[];
  comments: CommentRow[];
  activities: ActivityRow[];
  currentUserId: string;
}): PersonalSummary {
  const { todos, comments, activities, currentUserId } = params;
  const assignedTodos = todos.filter((todo) => todo.assigned_to === currentUserId);
  const completedTodos = assignedTodos.filter((todo) => todo.completed).length;
  const commentsCount = comments.filter((comment) => comment.created_by === currentUserId).length;
  const activitiesAssigned = activities.filter((activity) => activity.assigned_to === currentUserId).length;

  return {
    todosAssignedTotal: assignedTodos.length,
    todosAssignedCompleted: completedTodos,
    todosAssignedOpen: Math.max(0, assignedTodos.length - completedTodos),
    commentsCount,
    activitiesAssigned,
  };
}

function buildUserIndicators(params: {
  users: Array<{ id: string; name: string; email: string; avatar_url: string | null }>;
  comments: CommentRow[];
  todos: TodoRow[];
  activities: ActivityRow[];
}): UserIndicator[] {
  const { users, comments, todos, activities } = params;
  const commentsByUser = new Map<string, number>();
  const todosCreatedByUser = new Map<string, number>();
  const todosCompletedByUser = new Map<string, number>();
  const activitiesCreatedByUser = new Map<string, number>();
  const activitiesAssignedByUser = new Map<string, number>();

  for (const comment of comments) {
    if (comment.created_by) {
      commentsByUser.set(comment.created_by, (commentsByUser.get(comment.created_by) ?? 0) + 1);
    }
  }

  for (const todo of todos) {
    if (todo.created_by) {
      todosCreatedByUser.set(todo.created_by, (todosCreatedByUser.get(todo.created_by) ?? 0) + 1);
    }
    if (todo.assigned_to && todo.completed) {
      todosCompletedByUser.set(todo.assigned_to, (todosCompletedByUser.get(todo.assigned_to) ?? 0) + 1);
    }
  }

  for (const activity of activities) {
    if (activity.created_by) {
      activitiesCreatedByUser.set(activity.created_by, (activitiesCreatedByUser.get(activity.created_by) ?? 0) + 1);
    }
    if (activity.assigned_to) {
      activitiesAssignedByUser.set(activity.assigned_to, (activitiesAssignedByUser.get(activity.assigned_to) ?? 0) + 1);
    }
  }

  return users.map((user) => ({
    user_id: user.id,
    name: user.name || user.email?.split('@')[0] || '-',
    email: user.email || '',
    avatar_url: user.avatar_url ?? null,
    comments_count: commentsByUser.get(user.id) ?? 0,
    todos_created: todosCreatedByUser.get(user.id) ?? 0,
    todos_completed: todosCompletedByUser.get(user.id) ?? 0,
    activities_created: activitiesCreatedByUser.get(user.id) ?? 0,
    activities_assigned: activitiesAssignedByUser.get(user.id) ?? 0,
  }));
}

function buildTeamTotals(params: {
  users: Array<{ id: string }>;
  projects: ProjectRow[];
  activities: ActivityRow[];
  comments: CommentRow[];
  todos: TodoRow[];
}): TeamTotals {
  const { users, projects, activities, comments, todos } = params;
  return {
    total_users: users.length,
    total_projects: projects.length,
    total_activities: activities.length,
    total_comments: comments.length,
    total_todos_created: todos.length,
    total_todos_completed: todos.filter((todo) => todo.completed === true).length,
  };
}

/**
 * GET /api/indicators
 * Returns team indicators for admins and personal indicators for regular users.
 */
router.get('/', async (req, res) => {
  const userId = getRequesterId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Nao autenticado' });
  }

  try {
    const isAdmin = await hasRole(userId, 'admin');
    const requestedScope = parseScope(req.query.scope);
    const scope: ScopeMode = !isAdmin ? 'me' : requestedScope ?? 'team';

    const [users, commentsRes, todosRes, projects, activities] = await Promise.all([
      fetchUsers(),
      supabase.from('cdt_comments').select('id, created_by, project_id'),
      fetchTodosForIndicators(),
      fetchProjects(),
      supabase.from('cdt_activities').select('id, name, status, assigned_to, due_date, created_by'),
    ]);

    if (commentsRes.error) throw commentsRes.error;
    if (todosRes.error) throw todosRes.error;
    if (activities.error) throw activities.error;

    const comments = (commentsRes.data ?? []) as CommentRow[];
    const todos = (todosRes.data ?? []) as TodoRow[];
    const activitiesList = (activities.data ?? []) as ActivityRow[];

    const byUser = buildUserIndicators({
      users,
      comments,
      todos,
      activities: activitiesList,
    });

    const byProject = buildProjectIndicators({
      projects,
      todos,
      comments,
      scope,
      currentUserId: userId,
    });

    const byActivity = buildActivityIndicators({
      activities: activitiesList,
      scope,
      currentUserId: userId,
    });

    const personal = buildPersonalSummary({
      todos,
      comments,
      activities: activitiesList,
      currentUserId: userId,
    });

    const recentAssignedTodos = buildRecentAssignedTodos({
      todos,
      projects,
      activities: activitiesList,
      currentUserId: userId,
    });

    const team = buildTeamTotals({
      users,
      projects,
      activities: activitiesList,
      comments,
      todos,
    });

    return res.json({
      scope,
      personal,
      recentAssignedTodos,
      by_user: byUser,
      by_project: byProject,
      by_activity: byActivity,
      team,
    });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching indicators:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch indicators',
    });
  }
});

export default router;
