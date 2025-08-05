import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  date: Date;
}

const STORAGE_KEY = 'crm_notifications';
const MAX_NOTIFICATIONS = 50;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load notifications from localStorage on init
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(STORAGE_KEY);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications).map((notification: any) => ({
          ...notification,
          date: new Date(notification.date)
        }));
        
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter((note: Notification) => !note.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);
  
  // Add a new notification
  const addNotification = useCallback((
    title: string,
    message: string,
    type: NotificationType = 'info',
    showToast = true
  ): Notification => {
    const newNotification: Notification = {
      id: Date.now(),
      title,
      message,
      type,
      read: false,
      date: new Date()
    };
    
    // Add to notifications and keep only the most recent MAX_NOTIFICATIONS
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount(prev => prev + 1);
    
    // Show a toast if requested
    if (showToast) {
      toast[type](title, { description: message });
    }
    
    return newNotification;
  }, []);
  
  // Mark a notification as read
  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setUnreadCount(0);
  }, []);
  
  // Delete a notification
  const deleteNotification = useCallback((id: number) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };
};

export default useNotifications;
