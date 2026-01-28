import express from 'express';
import { supabase } from '../config/supabase.js';
import { ProjectTodo } from '../types/index.js';

const router = express.Router();

// Get all todos for a project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('cdt_project_todos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch todos' });
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const { project_id, title, assigned_to } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ error: 'project_id and title are required' });
    }

    // Get the max sort_order for this project
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
      })
      .select()
      .single();

    if (error) {
      throw error;
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
    const { id } = req.params;
    const { title, completed, assigned_to } = req.body;

    // Buscar TODO atual para verificar se assigned_to mudou
    const { data: currentTodo } = await supabase
      .from('cdt_project_todos')
      .select('assigned_to, project_id')
      .eq('id', id)
      .single();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;

    const { data, error } = await supabase
      .from('cdt_project_todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Se assigned_to mudou e foi atribuído a alguém, criar notificação
    if (assigned_to && assigned_to !== currentTodo?.assigned_to) {
      // Buscar nome do projeto
      const { data: project } = await supabase
        .from('cdt_projects')
        .select('name')
        .eq('id', currentTodo?.project_id)
        .single();

      // Criar notificação
      await supabase
        .from('cdt_notifications')
        .insert({
          user_id: assigned_to,
          type: 'todo_assigned',
          title: 'Novo TODO atribuído',
          message: `Você foi atribuído como responsável pelo TODO "${title || data.title}" no projeto "${project?.name || 'Projeto'}"`,
          related_id: id,
          related_type: 'todo',
        });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: error.message || 'Failed to update todo' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('cdt_project_todos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: error.message || 'Failed to delete todo' });
  }
});

// Reorder todos
router.post('/reorder', async (req, res) => {
  try {
    const { project_id, todo_ids } = req.body;

    if (!project_id || !Array.isArray(todo_ids)) {
      return res.status(400).json({ error: 'project_id and todo_ids array are required' });
    }

    // Update sort_order for each todo
    const updates = todo_ids.map((todoId: string, index: number) => 
      supabase
        .from('cdt_project_todos')
        .update({ sort_order: index })
        .eq('id', todoId)
        .eq('project_id', project_id)
    );

    await Promise.all(updates);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering todos:', error);
    res.status(500).json({ error: error.message || 'Failed to reorder todos' });
  }
});

export default router;
