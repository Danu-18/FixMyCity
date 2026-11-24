import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes complaint image URLs ensuring correct port, protocol, and storage routing.
 */
export function getComplaintImageUrl(url?: string | null): string | null {
  if (!url) return null;

  const storageBase = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage';
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

  if (url.startsWith('http://localhost/storage/')) {
    return url.replace('http://localhost/storage/', `${storageBase}/`);
  }
  if (url.startsWith('http://127.0.0.1/storage/')) {
    return url.replace('http://127.0.0.1/storage/', `${storageBase}/`);
  }
  if (url.startsWith('/storage/')) {
    return `${apiBase}${url}`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `${storageBase}/${url.replace(/^storage\//, '').replace(/^\/+/, '')}`;
  }

  return url;
}
