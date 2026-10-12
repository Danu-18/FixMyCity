import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface SlaBadgeProps {
  deadline?: string | null;
  status: string;
  isBreached?: boolean;
}

export function SlaBadge({ deadline, status, isBreached }: SlaBadgeProps) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" />
        SLA Fulfilled
      </span>
    );
  }

  if (status === 'Rejected') {
    return (
      <span className="text-xs text-zinc-500">
        Closed
      </span>
    );
  }

  if (!deadline) {
    return null;
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (isBreached || diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        Overdue by {overdueHours}h
      </span>
    );
  }

  if (diffHours <= 12) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        {diffHours}h left (Urgent)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
      <Clock className="w-3.5 h-3.5 text-blue-500" />
      {diffHours}h remaining
    </span>
  );
}
