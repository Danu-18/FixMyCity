'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Complaint } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaBadge } from './SlaBadge';
import { ThumbsUp, MapPin, Calendar, Building2, Image as ImageIcon } from 'lucide-react';
import { apiToggleUpvote } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvoteChange?: (id: number, count: number, hasUpvoted: boolean) => void;
}

export function ComplaintCard({ complaint, onUpvoteChange }: ComplaintCardProps) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState<number>(complaint.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(complaint.has_upvoted || false);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await apiToggleUpvote(complaint.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
      if (onUpvoteChange) {
        onUpvoteChange(complaint.id, res.upvotes_count, res.has_upvoted);
      }
    } catch (err) {
      console.error('Failed to toggle upvote', err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
              #{complaint.tracking_number}
            </span>
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={complaint.priority} size="sm" />
              <StatusBadge status={complaint.status} size="sm" />
            </div>
          </div>

          <Link href={`/complaints/${complaint.id}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base line-clamp-1">
              {complaint.title}
            </h3>
          </Link>

          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Thumbnail preview if photo exists */}
        {complaint.image_url && (
          <div className="px-5 py-2">
            <div className="relative h-32 w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img
                src={complaint.image_url}
                alt={complaint.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Department & Location metadata */}
        <div className="px-5 py-3 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
          {complaint.department && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{complaint.department.department_name}</span>
            </div>
          )}
          {complaint.address && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{complaint.address}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>
            <SlaBadge
              deadline={complaint.sla_deadline}
              status={complaint.status}
              isBreached={complaint.is_sla_breached}
            />
          </div>
        </div>
      </div>

      {/* Card Footer: Upvote action and View button */}
      <div className="px-5 py-3 bg-zinc-50/75 dark:bg-zinc-900/75 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <button
          onClick={handleUpvote}
          disabled={isVoting}
          aria-label={`Upvote issue, current votes ${upvotes}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            hasUpvoted
              ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
          <span>{upvotes}</span>
          <span className="hidden sm:inline">Upvotes</span>
        </button>

        <Link
          href={`/complaints/${complaint.id}`}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
