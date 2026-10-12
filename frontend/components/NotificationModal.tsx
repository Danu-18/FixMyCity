'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGetNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead } from '@/lib/api';
import { NotificationItem } from '@/lib/types';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
    await apiMarkNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    refreshNotifications();
  };

  const handleMarkAllRead = async () => {
    await apiMarkAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshNotifications();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 transition-colors ${
                  n.is_read ? 'bg-white dark:bg-zinc-900' : 'bg-indigo-50/50 dark:bg-indigo-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {n.title}
                  </h4>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {n.message}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  {n.complaint_id && (
                    <Link
                      href={`/complaints/${n.complaint_id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Complaint
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
