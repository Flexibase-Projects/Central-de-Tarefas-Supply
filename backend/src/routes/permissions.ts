import express from 'express';
import { supabase } from '../config/supabase.js';
import { Permission } from '../types/index.js';

const router = express.Router();

// Get all permissions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cdt_permissions')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permissions' });
  }
});

// Get permission by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('cdt_permissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch permission' });
  }
});

export default router;
