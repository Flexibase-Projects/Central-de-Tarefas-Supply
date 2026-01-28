import express from 'express';
import { supabase } from '../config/supabase.js';
import { Project } from '../types/index.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
      return res.status(503).json({ 
        error: 'Supabase not configured',
        message: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in backend/.env'
      });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
      return res.status(503).json({ 
        error: 'Supabase not configured',
        message: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in backend/.env'
      });
    }

    const project: Partial<Project> = req.body;
    console.log('Creating project with data:', project);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: project.name,
        description: project.description || null,
        status: project.status || 'backlog',
        github_url: project.github_url || null,
        github_owner: project.github_owner || null,
        github_repo: project.github_repo || null,
        created_by: project.created_by || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating project:', error);
      throw error;
    }
    
    console.log('Project created successfully:', data);
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create project',
      details: error.details || error.hint || null
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Partial<Project> = req.body;

    // Validar status se fornecido
    const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Preparar update apenas com campos válidos
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.github_url !== undefined) updateData.github_url = updates.github_url;
    if (updates.github_owner !== undefined) updateData.github_owner = updates.github_owner;
    if (updates.github_repo !== undefined) updateData.github_repo = updates.github_repo;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

export default router;
