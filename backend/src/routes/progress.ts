import express from 'express';
import { supabase } from '../config/supabase.js';
import {
  isSupabaseConnectionRefused,
  SUPABASE_UNAVAILABLE_MESSAGE,
} from '../utils/supabase-errors.js';
import { getLevelFromTotalXp, getXpThresholds } from '../utils/level-xp.js';
import { getTierForLevel } from '../utils/tier.js';
import {
  PRESET_ACHIEVEMENTS,
  evaluateAchievements,
  type AchievementContext,
} from '../utils/achievement-engine.js';

const router = express.Router();

const XP_PER_TODO = 1;
const XP_PER_ACTIVITY = 1;

interface XpResult {
  totalXp: number;
  completedTodos: number;
  completedActivities: number;
  deadlineTodos: number;
  deadlineActivities: number;
  challengeTodos: number;
  commentsCount: number;
  streakDays: number;
}

interface AchievementRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  category?: string;
  mode?: string;
  conditionType?: string | null;
  conditionValue?: number | null;
  rewardPercent?: number;
  xpBonus: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

function roundXp(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function computeXpAndStats(userId: string): Promise<XpResult> {
  try {
    const { data: xpLog, error: xpLogError } = await supabase
      .from('cdt_user_xp_log')
      .select('xp_amount')
      .eq('user_id', userId);

    if (!xpLogError && xpLog && xpLog.length > 0) {
      const totalXp = roundXp(
        (xpLog as Array<{ xp_amount: number | null }>).reduce(
          (sum, row) => sum + parseNumber(row.xp_amount, 0),
          0,
        ),
      );
      const stats = await fetchExtendedStats(userId);
      return { totalXp, ...stats };
    }
  } catch {
    // Continue to legacy strategy
  }

  try {
    const [todosRes, activitiesRes] = await Promise.all([
      supabase
        .from('cdt_project_todos')
        .select('xp_reward, completed_at, deadline, achievement_id')
        .eq('assigned_to', userId)
        .eq('completed', true),
      supabase
        .from('cdt_activities')
        .select('xp_reward, completed_at, due_date')
        .eq('status', 'done')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`),
    ]);

    if (!todosRes.error && !activitiesRes.error) {
      type TodoRow = {
        xp_reward?: number | null;
        completed_at?: string | null;
        deadline?: string | null;
        achievement_id?: string | null;
      };
      type ActivityRow = {
        xp_reward?: number | null;
        completed_at?: string | null;
        due_date?: string | null;
      };

      const todos = (todosRes.data ?? []) as TodoRow[];
      const activities = (activitiesRes.data ?? []) as ActivityRow[];

      const completedTodos = todos.length;
      const completedActivities = activities.length;

      const todoXp = todos.reduce((sum, t) => sum + parseNumber(t.xp_reward, XP_PER_TODO), 0);
      const activityXp = activities.reduce(
        (sum, a) => sum + parseNumber(a.xp_reward, XP_PER_ACTIVITY),
        0,
      );
      const totalXp = roundXp(todoXp + activityXp);

      const deadlineTodos = todos.filter(
        (t) => t.completed_at && t.deadline && new Date(t.completed_at) <= new Date(t.deadline),
      ).length;

      const deadlineActivities = activities.filter(
        (a) => a.completed_at && a.due_date && new Date(a.completed_at) <= new Date(a.due_date),
      ).length;

      const challengeTodos = todos.filter((t) => t.achievement_id != null).length;
      const commentsCount = await fetchCommentsCount(userId);
      const streakDays = await fetchStreakDays(userId);

      return {
        totalXp,
        completedTodos,
        completedActivities,
        deadlineTodos,
        deadlineActivities,
        challengeTodos,
        commentsCount,
        streakDays,
      };
    }
  } catch {
    // Continue to last fallback
  }

  const [todosRes, activitiesRes] = await Promise.all([
    supabase
      .from('cdt_project_todos')
      .select('id')
      .eq('assigned_to', userId)
      .eq('completed', true),
    supabase
      .from('cdt_activities')
      .select('id')
      .eq('status', 'done')
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`),
  ]);

  const completedTodos = todosRes.data?.length ?? 0;
  const completedActivities = activitiesRes.data?.length ?? 0;

  return {
    totalXp: roundXp(completedTodos * XP_PER_TODO + completedActivities * XP_PER_ACTIVITY),
    completedTodos,
    completedActivities,
    deadlineTodos: 0,
    deadlineActivities: 0,
    challengeTodos: 0,
    commentsCount: 0,
    streakDays: 0,
  };
}

interface ExtendedStats {
  completedTodos: number;
  completedActivities: number;
  deadlineTodos: number;
  deadlineActivities: number;
  challengeTodos: number;
  commentsCount: number;
  streakDays: number;
}

async function fetchExtendedStats(userId: string): Promise<ExtendedStats> {
  try {
    type TodoRow = {
      completed_at?: string | null;
      deadline?: string | null;
      achievement_id?: string | null;
    };
    type ActivityRow = {
      completed_at?: string | null;
      due_date?: string | null;
    };

    const [todosRes, activitiesRes] = await Promise.all([
      supabase
        .from('cdt_project_todos')
        .select('id, completed_at, deadline, achievement_id')
        .eq('assigned_to', userId)
        .eq('completed', true),
      supabase
        .from('cdt_activities')
        .select('id, completed_at, due_date')
        .eq('status', 'done')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`),
    ]);

    const todos = (todosRes.data ?? []) as TodoRow[];
    const activities = (activitiesRes.data ?? []) as ActivityRow[];

    const deadlineTodos = todos.filter(
      (t) => t.completed_at && t.deadline && new Date(t.completed_at) <= new Date(t.deadline),
    ).length;

    const deadlineActivities = activities.filter(
      (a) => a.completed_at && a.due_date && new Date(a.completed_at) <= new Date(a.due_date),
    ).length;

    const challengeTodos = todos.filter((t) => t.achievement_id != null).length;
    const commentsCount = await fetchCommentsCount(userId);
    const streakDays = await fetchStreakDays(userId);

    return {
      completedTodos: todos.length,
      completedActivities: activities.length,
      deadlineTodos,
      deadlineActivities,
      challengeTodos,
      commentsCount,
      streakDays,
    };
  } catch {
    return {
      completedTodos: 0,
      completedActivities: 0,
      deadlineTodos: 0,
      deadlineActivities: 0,
      challengeTodos: 0,
      commentsCount: 0,
      streakDays: 0,
    };
  }
}

async function fetchCommentsCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cdt_project_comments')
      .select('id')
      .eq('user_id', userId);
    if (error) return 0;
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

async function fetchStreakDays(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cdt_user_xp_log')
      .select('created_at, reason')
      .eq('user_id', userId)
      .in('reason', ['todo_completed', 'activity_completed'])
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return 0;

    const uniqueDays: string[] = Array.from(
      new Set((data as Array<{ created_at: string }>).map((row) => row.created_at.substring(0, 10))),
    ).sort((a: string, b: string) => (a > b ? -1 : 1));

    if (uniqueDays.length === 0) return 0;

    const today = new Date().toISOString().substring(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().substring(0, 10);

    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1] as string);
      const curr = new Date(uniqueDays[i] as string);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  } catch {
    return 0;
  }
}

async function fetchAchievements(userId: string, ctx: AchievementContext): Promise<AchievementRow[]> {
  try {
    const [allRes, userRes] = await Promise.all([
      supabase
        .from('cdt_achievements')
        .select(
          'id, slug, name, description, icon, category, rarity, xp_bonus, reward_xp_fixed, reward_percent, condition_type, condition_value, mode',
        )
        .eq('is_active', true)
        .order('slug'),
      supabase
        .from('cdt_user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId),
    ]);

    if (!allRes.error && allRes.data) {
      const unlockedMap = new Map<string, string | null>();
      if (!userRes.error && userRes.data) {
        for (const row of userRes.data as Array<{ achievement_id: string; unlocked_at: string | null }>) {
          unlockedMap.set(row.achievement_id, row.unlocked_at ?? null);
        }
      }

      type DbAch = {
        id: string;
        slug: string;
        name: string;
        description: string;
        icon: string;
        category: string;
        rarity: string;
        xp_bonus: number | null;
        reward_xp_fixed?: number | null;
        reward_percent?: number | null;
        condition_type?: string | null;
        condition_value?: number | null;
        mode?: string | null;
      };

      return (allRes.data as DbAch[]).map((a): AchievementRow => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        rarity: a.rarity,
        mode: a.mode ?? 'global_auto',
        conditionType: a.condition_type ?? null,
        conditionValue: a.condition_value ?? null,
        rewardPercent: parseNumber(a.reward_percent, 0),
        xpBonus: roundXp(parseNumber(a.reward_xp_fixed, parseNumber(a.xp_bonus, 0))),
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id) ?? null,
      }));
    }
  } catch {
    // fallback below
  }

  const newlyUnlocked = new Set(evaluateAchievements(ctx, new Set<string>()));
  return PRESET_ACHIEVEMENTS.map((a): AchievementRow => ({
    id: a.slug,
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    rarity: a.rarity,
    xpBonus: roundXp(a.xpBonus),
    unlocked: newlyUnlocked.has(a.slug),
    unlockedAt: newlyUnlocked.has(a.slug) ? new Date().toISOString() : null,
  }));
}

router.get('/', async (req, res) => {
  const userId = (req as express.Request & { userId?: string }).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Nao autenticado' });
  }

  try {
    const stats = await computeXpAndStats(userId);
    const { level, xpInCurrentLevel, xpForNextLevel } = getLevelFromTotalXp(stats.totalXp);
    const tier = getTierForLevel(level);

    const ctx: AchievementContext = {
      completedTodos: stats.completedTodos,
      completedActivities: stats.completedActivities,
      level,
      totalXp: stats.totalXp,
      streakDays: stats.streakDays,
      deadlineTodos: stats.deadlineTodos,
      deadlineActivities: stats.deadlineActivities,
      challengeTodos: stats.challengeTodos,
      commentsCount: stats.commentsCount,
    };

    const achievements = await fetchAchievements(userId, ctx);

    return res.json({
      completedTodos: stats.completedTodos,
      completedActivities: stats.completedActivities,
      totalXp: roundXp(stats.totalXp),
      level,
      xpInCurrentLevel: roundXp(xpInCurrentLevel),
      xpForNextLevel: roundXp(xpForNextLevel),
      streakDays: stats.streakDays,
      tier: {
        name: tier.name,
        color: tier.color,
        glowColor: tier.glowColor,
        cssClass: tier.cssClass,
        gradient: tier.gradient ?? null,
      },
      achievements,
    });
  } catch (error: unknown) {
    if (isSupabaseConnectionRefused(error)) {
      return res.status(503).json({ error: SUPABASE_UNAVAILABLE_MESSAGE });
    }
    console.error('Error fetching progress:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Falha ao buscar progresso',
    });
  }
});

router.get('/thresholds', (_req, res) => {
  return res.json({ thresholds: getXpThresholds().slice(0, 25) });
});

export default router;
