import express from 'express';
import { supabase } from '../config/supabase.js';
import { Task } from '../types/index.js';

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('cdt_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('cdt_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const task: Partial<Task> = req.body;
    
    const { data, error } = await supabase
      .from('cdt_tasks')
      .insert([{
        project_id: task.project_id,
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assigned_to: task.assigned_to || null,
        created_by: task.created_by || null,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Partial<Task> = req.body;

    const { data, error } = await supabase
      .from('cdt_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

export default router;
