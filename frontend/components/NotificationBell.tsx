'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationModal } from '@/components/NotificationModal';

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
}

export function NotificationBell({
  className = '',
  iconClassName = 'w-4 h-4',
}: NotificationBellProps) {
  const { user, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer ${className}`}
        aria-label="View notifications"
        title="View notifications"
      >
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
