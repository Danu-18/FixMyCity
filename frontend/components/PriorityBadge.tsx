import React from 'react';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, className = '', size = 'md' }: PriorityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  switch (priority) {
    case 'Urgent':
      return (
        <span className={`inline-flex items-center rounded-md bg-red-100 text-red-800 border border-red-300 font-semibold dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 ${sizeClasses} ${className}`}>
          ● Urgent
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center rounded-md bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800 ${sizeClasses} ${className}`}>
          High
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center rounded-md bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 ${sizeClasses} ${className}`}>
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 ${sizeClasses} ${className}`}>
          Low
        </span>
      );
  }
}
