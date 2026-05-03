export type SensorType = 'steps' | 'timer' | 'reps' | 'water' | 'none';

export interface Task {
  id: number;
  user_id?: number;
  title: string;
  description?: string;
  difficulty: number;
  estimated_minutes?: number;
  schedule_type: 'one_time' | 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  // Smart tracking fields
  target?: number;        // e.g. 10000 steps, 8 glasses, 30 mins
  sensor_type?: SensorType;
  current_progress?: number; // live value injected client-side
}

export interface TaskCreate {
  title: string;
  description?: string;
  difficulty: number;
  estimated_minutes?: number;
  schedule_type: 'one_time' | 'daily' | 'weekly';
  target?: number;
  sensor_type?: SensorType;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  difficulty?: number;
  estimated_minutes?: number;
  schedule_type?: 'one_time' | 'daily' | 'weekly';
}

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'achievement';
  message: string;
  priority: number;
}

export interface Dashboard {
  tasks: Task[];
  streak: number;
  longest_streak: number;
  xp: number;
  level: number;
  coins: number;
  consistency_index: number;
  total_completions: number;
  insights: AIInsight[];
  suggestions: string[];
}

export interface CompleteTaskResult {
  status: string;
  xp_gained: number;
  new_streak: number;
  new_xp: number;
  new_level: number;
  consistency_index: number;
  level_up: boolean;
}

export interface PaginatedTasks {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}
