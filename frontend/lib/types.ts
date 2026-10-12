export type UserRole = 'citizen' | 'authority' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  department_id?: number | null;
  department?: Department | null;
  created_at?: string;
}

export interface Department {
  id: number;
  department_name: string;
  contact_email: string;
  phone?: string | null;
  description?: string | null;
  sla_hours: number;
  total_complaints?: number;
  pending_complaints?: number;
  in_progress_complaints?: number;
  resolved_complaints?: number;
  breached_complaints?: number;
  staff_count?: number;
  categories?: Category[];
}

export interface Category {
  id: number;
  category_name: string;
  department_id: number;
  description?: string | null;
  default_priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  sla_hours: number;
  icon?: string | null;
  department?: Department;
  complaints_count?: number;
}

export interface StatusHistoryItem {
  id: number;
  complaint_id: number;
  old_status?: string | null;
  new_status: string;
  changed_by?: number | null;
  notes?: string | null;
  changed_at: string;
  changer?: {
    id: number;
    name: string;
    role: string;
  } | null;
}

export interface Complaint {
  id: number;
  tracking_number: string;
  user_id?: number | null;
  category_id: number;
  department_id: number;
  title: string;
  description: string;
  image_path?: string | null;
  image_url?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  sla_deadline?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  resolution_image?: string | null;
  resolution_image_url?: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
  category?: Category;
  user?: {
    id: number;
    name: string;
    role: string;
  } | null;
  status_history?: StatusHistoryItem[];
  upvotes_count?: number;
  has_upvoted?: boolean;
  is_sla_breached?: boolean;
}

export interface HeatmapPoint {
  id: number;
  tracking_number: string;
  title: string;
  lat: number;
  lng: number;
  intensity: number;
  category: string;
  department: string;
  status: string;
  priority: string;
  address?: string | null;
  image_url?: string | null;
  upvotes_count?: number;
  is_sla_breached?: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  complaint_id?: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  complaint?: {
    id: number;
    tracking_number: string;
    title: string;
    status: string;
  } | null;
}

export interface AnalyticsOverview {
  summary: {
    total_complaints: number;
    pending: number;
    in_progress: number;
    resolved: number;
    rejected: number;
    active_breached: number;
    sla_compliance_rate: number;
    avg_resolution_hours: number;
  };
  departments: Array<{
    id: number;
    name: string;
    total: number;
    resolved: number;
    breached: number;
    sla_target_hours: number;
  }>;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
