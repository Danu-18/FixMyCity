'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Complaint } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaBadge } from './SlaBadge';
import { ThumbsUp, MapPin, Building2, Clock, MessageSquare } from 'lucide-react';
import { apiToggleUpvote } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvoteChange?: (id: number, count: number, hasUpvoted: boolean) => void;
}

export function ComplaintCard({ complaint, onUpvoteChange }: ComplaintCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState<number>(complaint.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(complaint.has_upvoted || false);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please sign in to upvote complaints.');
      router.push('/login');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await apiToggleUpvote(complaint.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
      if (res.has_upvoted) {
        toast.success(`Upvoted #${complaint.tracking_number}!`);
      } else {
        toast.info(`Upvote removed from #${complaint.tracking_number}.`);
      }
      if (onUpvoteChange) {
        onUpvoteChange(complaint.id, res.upvotes_count, res.has_upvoted);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update upvote.');
    } finally {
      setIsVoting(false);
    }
  };

  const formattedDate = new Date(complaint.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="lift flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-muted-foreground">
            #{complaint.tracking_number}
          </span>
          <span className="ml-auto" />
          <PriorityBadge priority={complaint.priority} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        {/* Title */}
        <Link
          href={`/complaints/${complaint.id}`}
          className="mt-3 block text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {complaint.title}
        </Link>

        {/* Description */}
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {complaint.description}
        </p>

        {/* Thumbnail Preview if Photo Attached */}
        {complaint.image_url && (
          <div className="mt-3 relative h-28 w-full overflow-hidden rounded-lg border border-border bg-muted/40">
            <img
              src={complaint.image_url}
              alt={complaint.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Details & Metadata List */}
        <ul className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
          {complaint.department && (
            <li className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{complaint.department.department_name}</span>
            </li>
          )}
          {complaint.address && (
            <li className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{complaint.address}</span>
            </li>
          )}
          <li className="flex items-center justify-between pt-0.5">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              {formattedDate}
            </span>
            <SlaBadge
              deadline={complaint.sla_deadline}
              status={complaint.status}
              isBreached={complaint.is_sla_breached}
            />
          </li>
        </ul>
      </div>

      {/* Card Action Buttons */}
      <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-xs font-semibold">
        <Link
          href={`/complaints/${complaint.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-foreground hover:bg-accent transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          View Details
        </Link>

        <button
          onClick={handleUpvote}
          disabled={isVoting}
          aria-label={`Upvote issue, current votes ${upvotes}`}
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition-all active:scale-90 ${
            hasUpvoted
              ? 'border-primary bg-primary text-primary-foreground shadow-xs'
              : 'border-input bg-background text-primary hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          <ThumbsUp className={`h-3 w-3 ${hasUpvoted ? 'fill-current' : ''}`} />
          <span>{upvotes}</span>
          <span className="hidden sm:inline">Upvote</span>
        </button>
      </div>
    </article>
  );
}
