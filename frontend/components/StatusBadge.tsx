import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'Resolved':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-brand-green/15 text-brand-green font-semibold ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          Resolved
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary font-semibold ${sizeClasses} ${className}`}>
          <Clock className="w-3 h-3 animate-spin" />
          In Progress
        </span>
      );
    case 'Rejected':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive font-semibold ${sizeClasses} ${className}`}>
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-brand-amber/25 text-brand-orange font-semibold ${sizeClasses} ${className}`}>
          <AlertCircle className="w-3 h-3" />
          Pending
        </span>
      );
  }
}
