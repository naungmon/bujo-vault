export type EntryType = 'task' | 'done' | 'migrated' | 'killed' | 'note' | 'event' | 'scheduled' | 'priority';

export interface Entry {
  id: string;
  type: EntryType;
  content: string;
  timestamp: number;
}

export interface DailyLog {
  date: string;
  entries: Entry[];
}

export type ViewType = 'daily' | 'monthly' | 'future' | 'migration' | 'review' | 'search' | 'coach' | 'settings';
