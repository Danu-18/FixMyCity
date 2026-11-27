'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { user, refreshNotifications } = useAuth();
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
    setNotifications([]);
    if (isOpen && user?.id) {
      fetchNotifs();
    }
  }, [isOpen, user?.id]);

  const handleMarkRead = async (id: number) => {
    try {
      await apiMarkNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      refreshNotifications();
    } catch {
      // Handled silently
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

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await handleMarkRead(notif.id);
    }
    onClose();

    if (user?.role === 'super_admin') {
      const isStaffNotif =
        notif.type?.toLowerCase().includes('staff') ||
        notif.title?.toLowerCase().includes('staff') ||
        notif.message?.toLowerCase().includes('staff') ||
        notif.message?.toLowerCase().includes('registration') ||
        notif.title?.toLowerCase().includes('registration');

      if (isStaffNotif) {
        router.push('/super-admin/staff');
      } else {
        router.push('/super-admin/moderation');
      }
    } else if (user?.role === 'authority') {
      router.push('/authority/queue');
    } else {
      if (notif.complaint_id) {
        router.push(`/complaints/${notif.complaint_id}`);
      } else {
        router.push('/track');
      }
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
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 transition-colors cursor-pointer hover:bg-accent/40 ${
                  notif.is_read ? 'bg-card/40' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground">
                    {notif.title}
                  </h4>
                  {!notif.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notif.id);
                      }}
                      className="text-[10px] text-primary hover:underline shrink-0 font-semibold cursor-pointer"
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
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <span>View Incident</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
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
