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
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-green">
        <CheckCircle className="w-3 h-3" />
        SLA Met
      </span>
    );
  }

  if (status === 'Rejected') {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Closed
      </span>
    );
  }

  if (!deadline) {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
        SLA Target 48h
      </span>
    );
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (isBreached || diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
        <AlertTriangle className="w-3 h-3 text-destructive" />
        Overdue by {overdueHours}h
      </span>
    );
  }

  if (diffHours <= 12) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber/25 px-2 py-0.5 text-[10px] font-semibold text-brand-orange">
        <Clock className="w-3 h-3" />
        {diffHours}h left (Urgent)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
      <Clock className="w-3 h-3" />
      {diffHours}h left
    </span>
  );
}
