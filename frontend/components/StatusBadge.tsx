import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  switch (status) {
    case 'Resolved':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Resolved
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 animate-spin" />
          In Progress
        </span>
      );
    case 'Rejected':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${sizeClasses} ${className}`}>
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${sizeClasses} ${className}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
}
