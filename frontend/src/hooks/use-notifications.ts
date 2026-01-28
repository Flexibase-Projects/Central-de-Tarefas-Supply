import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = currentUser.id;
      const response = await fetch(`${API_URL}/api/notifications?userId=${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    try {
      const userId = currentUser.id;
      const response = await fetch(`${API_URL}/api/notifications/unread-count?userId=${userId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id: string) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/notifications/${id}/read?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/notifications/read-all?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_URL}/api/notifications/${id}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const notification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
}
