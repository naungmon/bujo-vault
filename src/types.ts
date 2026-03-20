export type EntryType = 'task' | 'done' | 'migrated' | 'killed' | 'note' | 'event' | 'scheduled' | 'priority';

export interface Entry {
  id: string;
  type: EntryType;
  content: string;
  timestamp: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  entries: Entry[];
}

export type ViewType = 'daily' | 'monthly' | 'future' | 'migration' | 'review' | 'search' | 'coach' | 'settings';

export interface CoachAnalysis {
  totalEntries: number;
  tasks: number;
  done: number;
  killed: number;
  migrated: number;
  priorities: number;
  completionRate: number;
  momentum: 'building' | 'steady' | 'stalling' | 'stalled';
  streak: number;
  stuckTasks: string[];
  killThemes: string[];
  question: string;
}
