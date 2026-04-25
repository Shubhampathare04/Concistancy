export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  difficulty: number;
  estimated_minutes?: number;
  schedule_type: 'one_time' | 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  difficulty: number;
  estimated_minutes?: number;
  schedule_type: 'one_time' | 'daily' | 'weekly';
}

export interface Dashboard {
  tasks: Task[];
  streak: number;
  xp: number;
  level: number;
  suggestions: string[];
}
