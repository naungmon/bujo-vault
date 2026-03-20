import React, { useState } from 'react';
import { useVault } from '../store/VaultContext';
import { DailyLog, Entry, EntryType } from '../types';
import { format, addDays } from 'date-fns';
import { ArrowRight, Check, X } from 'lucide-react';

export function MigrationView() {
  const { logs, updateEntry, migrateEntry } = useVault();

  const pendingTasks: Array<{ date: string; entry: Entry }> = [];
  for (const [date, log] of Object.entries(logs) as [string, DailyLog][]) {
    for (const entry of log.entries) {
      if (entry.type === 'task' || entry.type === 'priority' || entry.type === 'scheduled') {
        pendingTasks.push({ date, entry });
      }
    }
  }
  pendingTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [processed, setProcessed] = useState<Set<string>>(new Set());

  const handleMigrate = (date: string, entry: Entry) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    migrateEntry(entry.id, date, tomorrow);
    setProcessed(prev => new Set([...prev, entry.id]));
  };

  const handleKill = (date: string, entry: Entry) => {
    updateEntry(date, entry.id, { type: 'killed' });
    setProcessed(prev => new Set([...prev, entry.id]));
  };

  const handleDone = (date: string, entry: Entry) => {
    updateEntry(date, entry.id, { type: 'done' });
    setProcessed(prev => new Set([...prev, entry.id]));
  };

  const remaining = pendingTasks.filter(t => !processed.has(t.entry.id));

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-2">
          Migration
        </h1>
        <p className="text-zinc-500 font-sans">
          {remaining.length} pending {remaining.length === 1 ? 'task' : 'tasks'} to review
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        {remaining.length === 0 ? (
          <div className="text-zinc-600 italic py-4 text-sm text-center">
            All caught up. No pending tasks to migrate.
          </div>
        ) : (
          <div className="space-y-1">
            {remaining.map(({ date, entry }) => (
              <div
                key={entry.id}
                className="group flex items-center gap-3 py-2 px-3 rounded-md hover:bg-zinc-900/30 transition-colors"
              >
                <span className="text-xs text-zinc-600 w-20 flex-shrink-0">
                  {format(new Date(date + 'T12:00:00'), 'MMM d')}
                </span>
                <span className={`flex-1 text-sm ${
                  entry.type === 'priority' ? 'text-yellow-400 font-medium' :
                  entry.type === 'scheduled' ? 'text-amber-400' :
                  'text-zinc-300'
                }`}>
                  {entry.content}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDone(date, entry)}
                    className="p-1.5 rounded hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition-colors"
                    title="Mark done"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleMigrate(date, entry)}
                    className="p-1.5 rounded hover:bg-indigo-500/20 text-zinc-500 hover:text-indigo-400 transition-colors"
                    title="Migrate to tomorrow"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => handleKill(date, entry)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Kill"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
