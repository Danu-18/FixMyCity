import React from 'react';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, className = '', size = 'md' }: PriorityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (priority) {
    case 'Urgent':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive font-bold ${sizeClasses} ${className}`}>
          ● Urgent
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center rounded-full bg-brand-pink/15 text-brand-pink font-semibold ${sizeClasses} ${className}`}>
          High
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center rounded-full bg-brand-amber/20 text-brand-orange font-semibold ${sizeClasses} ${className}`}>
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-muted text-muted-foreground font-medium ${sizeClasses} ${className}`}>
          Low
        </span>
      );
  }
}
