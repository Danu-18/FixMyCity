import {
  AnalyticsOverview,
  Category,
  Complaint,
  Department,
  HeatmapPoint,
  NotificationItem,
  PaginatedResponse,
  User,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fmc_auth_token');
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // If body is not FormData and Content-Type not set, default to JSON
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
    if (response.status === 429) {
      errorMsg = 'Too many attempts, please try again in 1 minute';
    }
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// Auth API
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(
  userData:
    | FormData
    | {
        name: string;
        email: string;
        password: string;
        phone?: string;
        role?: string;
        department_id?: number | null;
      }
): Promise<{ message?: string; token?: string | null; user: User }> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: userData instanceof FormData ? userData : JSON.stringify(userData),
  });
}

export async function apiGetMe(): Promise<{ user: User }> {
  return apiFetch('/auth/me');
}

export async function apiLogout(): Promise<{ message: string }> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

// Complaints API
export async function apiGetComplaints(params: Record<string, string | number | boolean | undefined> = {}): Promise<PaginatedResponse<Complaint>> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });
  const queryString = searchParams.toString();
  return apiFetch(`/complaints${queryString ? `?${queryString}` : ''}`);
}

export async function apiGetComplaint(idOrTracking: string | number): Promise<Complaint> {
  return apiFetch(`/complaints/${idOrTracking}`);
}

export async function apiSubmitComplaint(formData: FormData): Promise<{ message: string; complaint: Complaint }> {
  return apiFetch('/complaints', {
    method: 'POST',
    body: formData,
  });
}

export async function apiUpdateComplaintStatus(
  id: number,
  formData: FormData | { status: string; notes?: string }
): Promise<{ message: string; complaint: Complaint }> {
  let body: any;
  if (formData instanceof FormData) {
    formData.append('_method', 'PATCH');
    body = formData;
  } else {
    body = JSON.stringify(formData);
  }

  return apiFetch(`/complaints/${id}/status`, {
    method: 'POST', // Handled via PATCH or POST with _method
    body,
  });
}

export async function apiToggleUpvote(id: number): Promise<{ has_upvoted: boolean; upvotes_count: number }> {
  return apiFetch(`/complaints/${id}/upvote`, {
    method: 'POST',
  });
}

// Master Data
export async function apiGetDepartments(): Promise<Department[]> {
  return apiFetch('/departments');
}

export async function apiGetCategories(): Promise<Category[]> {
  return apiFetch('/categories');
}

// Heatmap & Analytics
export async function apiGetHeatmap(params: Record<string, string | number | undefined> = {}): Promise<{ total: number; points: HeatmapPoint[] }> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });
  const queryString = searchParams.toString();
  return apiFetch(`/heatmap${queryString ? `?${queryString}` : ''}`);
}

export async function apiGetAnalytics(): Promise<AnalyticsOverview> {
  return apiFetch('/analytics/overview');
}

// Notifications
export async function apiGetNotifications(): Promise<{ unread_count: number; notifications: PaginatedResponse<NotificationItem> }> {
  return apiFetch('/notifications');
}

export async function apiMarkNotificationRead(id: number): Promise<void> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}

// Admin SLA check
export async function apiTriggerSlaCheck(): Promise<any> {
  return apiFetch('/sla/trigger-check', { method: 'POST' });
}

// Super Admin Staff Verification API
export async function apiGetPendingStaff(): Promise<User[]> {
  return apiFetch('/super-admin/pending-staff');
}

export async function apiDownloadStaffDocument(id: number): Promise<Blob> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/super-admin/staff/${id}/document`;
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: '*/*',
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to download document (${res.status})`);
  }
  return res.blob();
}

export async function apiApproveStaff(id: number): Promise<{ message: string; user: User }> {
  return apiFetch(`/super-admin/staff/${id}/approve`, { method: 'POST' });
}

export async function apiRejectStaff(id: number): Promise<{ message: string; user: User }> {
  return apiFetch(`/super-admin/staff/${id}/reject`, { method: 'POST' });
}
