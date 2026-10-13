'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGetNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead } from '@/lib/api';
import { NotificationItem } from '@/lib/types';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGetNotifications();
      setNotifications(res.notifications?.data || []);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      refreshNotifications();
      toast.info('Notification marked as read.');
    } catch {
      toast.error('Failed to update notification status.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refreshNotifications();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border border-border overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors ${
                  notif.is_read ? 'bg-card/40' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground">
                    {notif.title}
                  </h4>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-[10px] text-primary hover:underline shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                  {notif.complaint_id && (
                    <Link
                      href={`/complaints/${notif.complaint_id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>View Incident</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
