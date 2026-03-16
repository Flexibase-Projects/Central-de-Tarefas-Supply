import express from 'express';
import { supabase } from '../config/supabase.js';
import { hasRole } from '../services/permissions.js';
import {
  calculateItemCompletionXp,
  awardTodoCompletionXp,
  evaluateAndAwardGlobalAchievements,
  getLinkedAchievementReward,
  unlockLinkedAchievementIfNeeded,
} from '../services/gamification.js';

const router = express.Router();

function getRequesterId(req: express.Request): string | null {
  return (
    ((req as express.Request & { userId?: string }).userId ?? null) ||
    (req.headers['x-user-id'] as string | undefined) ||
    null
  );
}

function parseDecimal(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Number(value.toFixed(2));
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Number(parsed.toFixed(2));
  }
  return fallback;
}

async function ensureAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const isAdmin = await hasRole(requesterId, 'admin');
  if (!isAdmin) {
    res.status(403).json({ error: 'Only admins can perform this action.' });
    return null;
  }
  return requesterId;
}

// Get all todos for a project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('cdt_project_todos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch todos' });
  }
});

// Create a new todo (admin only)
router.post('/', async (req, res) => {
  try {
    const requesterId = await ensureAdmin(req, res);
    if (!requesterId) return;

    const {
      project_id,
      title,
      assigned_to,
      xp_reward,
      deadline,
      achievement_id,
      deadline_bonus_percent,
    } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ error: 'project_id and title are required' });
    }

    const { data: maxTodo } = await supabase
      .from('cdt_project_todos')
      .select('sort_order')
      .eq('project_id', project_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sort_order = maxTodo ? maxTodo.sort_order + 1 : 0;

    const { data, error } = await supabase
      .from('cdt_project_todos')
      .insert({
        project_id,
        title,
        completed: false,
        assigned_to: assigned_to || null,
        sort_order,
        xp_reward: parseDecimal(xp_reward, 1),
        deadline: deadline || null,
        achievement_id: achievement_id || null,
        deadline_bonus_percent: parseDecimal(deadline_bonus_percent, 0),
        completed_at: null,
      })
      .select()
      .single();

    if (error) throw error;

    if (assigned_to) {
      const { data: project } = await supabase
        .from('cdt_projects')
        .select('name')
        .eq('id', project_id)
        .single();

      await supabase.from('cdt_notifications').insert({
        user_id: assigned_to,
        type: 'todo_assigned',
        title: 'Novo TO-DO para voce!',
        message: `Voce foi atribuido ao TODO "${title}" no projeto "${project?.name || 'Projeto'}"`,
        related_id: data.id,
        related_type: 'todo',
        project_id,
      });
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: error.message || 'Failed to create todo' });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const isAdmin = await hasRole(requesterId, 'admin');
    const { title, completed, assigned_to, xp_reward, deadline, achievement_id, deadline_bonus_percent } = req.body;
    const incomingKeys = Object.keys(req.body as Record<string, unknown>);

    const { data: currentTodo, error: currentTodoError } = await supabase
      .from('cdt_project_todos')
      .select(
        'id, title, assigned_to, project_id, completed, xp_reward, deadline, achievement_id, deadline_bonus_percent, completed_at',
      )
      .eq('id', id)
      .single();

    if (currentTodoError) throw currentTodoError;
    if (!currentTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (!isAdmin) {
      const onlyCompletionUpdate =
        incomingKeys.length === 1 &&
        incomingKeys.includes('completed') &&
        typeof completed === 'boolean';

      if (!onlyCompletionUpdate) {
        return res.status(403).json({ error: 'Only admins can edit todo configuration.' });
      }
      if (currentTodo.assigned_to !== requesterId) {
        return res.status(403).json({ error: 'You can only complete todos assigned to you.' });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;

    if (isAdmin) {
      if (xp_reward !== undefined) updateData.xp_reward = parseDecimal(xp_reward, 1);
      if (deadline !== undefined) updateData.deadline = deadline || null;
      if (achievement_id !== undefined) updateData.achievement_id = achievement_id || null;
      if (deadline_bonus_percent !== undefined) {
        updateData.deadline_bonus_percent = parseDecimal(deadline_bonus_percent, 0);
      }
    }

    const transitionedToCompleted = completed === true && currentTodo.completed !== true;
    const transitionedToOpen = completed === false && currentTodo.completed === true;

    if (transitionedToCompleted) {
      updateData.completed_at = new Date().toISOString();
    } else if (transitionedToOpen) {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('cdt_project_todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (transitionedToCompleted && data.assigned_to) {
      const linkedReward = await getLinkedAchievementReward(data.achievement_id ?? null);
      const completedAt = data.completed_at ? new Date(data.completed_at) : new Date();
      const onDeadline =
        Boolean(data.deadline) && completedAt.getTime() <= new Date(data.deadline as string).getTime();

      const xpAmount = calculateItemCompletionXp({
        baseXp: parseDecimal(data.xp_reward, 1),
        onDeadline,
        deadlineBonusPercent: parseDecimal(data.deadline_bonus_percent, 0),
        linkedAchievementFixedXp: linkedReward.fixedXp,
        linkedAchievementPercent: linkedReward.percent,
      });

      const awarded = await awardTodoCompletionXp({
        userId: data.assigned_to,
        todoId: data.id,
        xpAmount,
      });

      await unlockLinkedAchievementIfNeeded(data.assigned_to, data.achievement_id ?? null);
      if (awarded) {
        await evaluateAndAwardGlobalAchievements(data.assigned_to);
      }
    }

    if (completed === true || (assigned_to === null && currentTodo.assigned_to)) {
      await supabase
        .from('cdt_notifications')
        .delete()
        .eq('related_id', id)
        .eq('related_type', 'todo');
    } else if (assigned_to && assigned_to !== currentTodo.assigned_to && completed !== true) {
      if (currentTodo.assigned_to) {
        await supabase
          .from('cdt_notifications')
          .delete()
          .eq('related_id', id)
          .eq('related_type', 'todo')
          .eq('user_id', currentTodo.assigned_to);
      }

      const { data: project } = await supabase
        .from('cdt_projects')
        .select('name')
        .eq('id', currentTodo.project_id)
        .single();

      await supabase.from('cdt_notifications').insert({
        user_id: assigned_to,
        type: 'todo_assigned',
        title: 'Novo TO-DO para voce!',
        message: `Voce foi atribuido ao TODO "${title || data.title}" no projeto "${project?.name || 'Projeto'}"`,
        related_id: id,
        related_type: 'todo',
        project_id: currentTodo.project_id || null,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: error.message || 'Failed to update todo' });
  }
});

// Delete a todo (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const requesterId = await ensureAdmin(req, res);
    if (!requesterId) return;

    const { id } = req.params;

    await supabase
      .from('cdt_notifications')
      .delete()
      .eq('related_id', id)
      .eq('related_type', 'todo');

    const { error } = await supabase
      .from('cdt_project_todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: error.message || 'Failed to delete todo' });
  }
});

// Reorder todos (admin only)
router.post('/reorder', async (req, res) => {
  try {
    const requesterId = await ensureAdmin(req, res);
    if (!requesterId) return;

    const { project_id, todo_ids } = req.body;

    if (!project_id || !Array.isArray(todo_ids)) {
      return res.status(400).json({ error: 'project_id and todo_ids array are required' });
    }

    const updates = todo_ids.map((todoId: string, index: number) =>
      supabase
        .from('cdt_project_todos')
        .update({ sort_order: index })
        .eq('id', todoId)
        .eq('project_id', project_id),
    );

    await Promise.all(updates);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering todos:', error);
    res.status(500).json({ error: error.message || 'Failed to reorder todos' });
  }
});

export default router;
