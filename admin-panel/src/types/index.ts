export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'analyst';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_onboarded: boolean;
  banned_at: string | null;
  created_at: string;
  total_completions: number;
  current_streak: number;
  level: number;
}

export interface AnalyticsOverview {
  total_users: number;
  active_users_today: number;
  active_users_7d: number;
  active_users_30d: number;
  total_tasks: number;
  total_completions: number;
  completion_rate: number;
  avg_streak: number;
  total_revenue: number;
  mrr: number;
  active_subscriptions: number;
}

export interface UserGrowth {
  date: string;
  new_users: number;
  total_users: number;
  dau: number;
}

export interface TaskAnalytics {
  total_tasks: number;
  active_tasks: number;
  avg_difficulty: number;
  completion_rate: number;
  total_completions: number;
  completions_today: number;
  completions_7d: number;
}

export interface Subscription {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  plan: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  user_email: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
