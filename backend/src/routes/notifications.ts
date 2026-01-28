import express from 'express';
import { supabase } from '../config/supabase.js';
import { Notification } from '../types/index.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data, error } = await supabase
      .from('cdt_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { count, error } = await supabase
      .from('cdt_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data, error } = await supabase
      .from('cdt_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { error } = await supabase
      .from('cdt_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { error } = await supabase
      .from('cdt_notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

export default router;
