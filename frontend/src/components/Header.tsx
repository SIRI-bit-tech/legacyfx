'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAbly } from '@/hooks/useAbly';
import TickerTape from '@/components/landing/TickerTape';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useAbly(user ? `notifications:${user.id}` : '', (message: any) => {
    if (message.name === 'new_notification' && message.data) {
      setNotifications(prev => [message.data, ...prev]);
    }
  });

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  return (
    <header className="bg-bg-secondary border-b border-color-border px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex-1 overflow-hidden h-8 lg:h-10 max-w-[50%] lg:max-w-2xl mr-4 rounded-xl border border-color-border bg-bg-tertiary">
        <TickerTape className="w-full h-full flex items-center" />
      </div>

      <div className="flex items-center gap-8">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-bg-tertiary border border-color-border flex items-center justify-center text-text-secondary hover:text-color-primary hover:border-color-primary transition-all group"
          >
            <i className="pi pi-bell group-hover:animate-swing text-sm lg:text-base"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 w-2 lg:w-2.5 h-2 lg:h-2.5 bg-color-danger rounded-full border-2 border-bg-secondary flex items-center justify-center">
                <span className="sr-only">{unreadCount} unread</span>
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 lg:right-0 mt-2 lg:mt-4 w-80 lg:w-96 bg-bg-secondary border border-color-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-[32rem]">
              <div className="p-5 border-b border-color-border flex justify-between items-center bg-bg-tertiary/20">
                <h3 className="font-black text-xs uppercase tracking-widest text-text-primary">Market Alerts</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-color-primary font-bold hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-[32rem] overflow-y-auto">
                {(notifications || []).length > 0 ? (
                  (notifications || []).map(notification => (
                    <div 
                      key={notification.id} 
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className={`p-5 hover:bg-bg-tertiary cursor-pointer transition-colors border-b border-color-border/30 group ${!notification.is_read ? 'bg-bg-tertiary/10' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                         <div className="flex items-center gap-2">
                           {!notification.is_read && <span className="w-1.5 h-1.5 rounded-full bg-color-primary"></span>}
                           <p className="text-text-primary font-bold text-sm group-hover:text-color-primary">{notification.title}</p>
                         </div>
                         <span className="text-[10px] text-text-tertiary">
                           {new Date(notification.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      <p className="text-text-secondary text-xs">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                     <p className="text-text-tertiary text-xs italic uppercase font-bold">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 lg:gap-4 pl-4 lg:pl-8 border-l border-color-border">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-text-primary font-black text-xs uppercase tracking-tight">
                  {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                </p>
                <div className="flex items-center justify-end gap-1">
                   <span className={`w-1.5 h-1.5 rounded-full ${user.kyc_status === 'VERIFIED' ? 'bg-color-success' : 'bg-color-warning'}`}></span>
                   <span className="text-text-tertiary text-[9px] font-black uppercase tracking-tighter hidden lg:inline">
                     {user.kyc_status === 'VERIFIED' ? 'Verified' : 'Unverified'} {user.tier}
                   </span>
                </div>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-color-primary text-bg-primary flex items-center justify-center font-black text-xs lg:text-sm shadow-lg shadow-color-primary/20">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-20 h-4 bg-bg-tertiary rounded hidden sm:block"></div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-bg-tertiary"></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
