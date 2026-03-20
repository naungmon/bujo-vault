import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVault } from '../store/VaultContext';
import { getGreeting, getTodayDateString } from '../lib/utils';
import { EntryItem } from './EntryItem';
import { InputBar } from './InputBar';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import { EntryType } from '../types';

const ENTRY_SORT_ORDER: Record<string, number> = {
  priority: 0, task: 1, event: 2, note: 3, killed: 4, done: 5, migrated: 6, scheduled: 6,
};

export function DailyView() {
  const { logs, updateEntry, clearDay } = useVault();
  const [date, setDate] = useState(getTodayDateString());
  const [greeting, setGreeting] = useState(getGreeting());
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dateRef = useRef(date);
  const focusedRef = useRef(focusedIndex);
  dateRef.current = date;
  focusedRef.current = focusedIndex;

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Session detection: focus input on empty day, focus list on existing
  useEffect(() => {
    const dayLog = logs[date];
    if (dayLog && dayLog.entries.length > 0 && focusedIndex === -1) {
      setFocusedIndex(dayLog.entries.length - 1);
    }
  }, [date, logs]);

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    const prev = subDays(d, 1);
    setDate(format(prev, 'yyyy-MM-dd'));
    setFocusedIndex(-1);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    const next = addDays(d, 1);
    setDate(format(next, 'yyyy-MM-dd'));
    setFocusedIndex(-1);
  };

  const handleToday = () => {
    setDate(getTodayDateString());
    setFocusedIndex(-1);
  };

  const dayLog = logs[date] || { date, entries: [] };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => {
        const log = logs[dateRef.current];
        const max = Math.max(0, (log?.entries.length || 1) - 1);
        return Math.min(max, prev + 1);
      });
    } else if (e.key === 'Escape') {
      setFocusedIndex(-1);
    } else if (e.key === 'x' && focusedRef.current >= 0) {
      const log = logs[dateRef.current];
      if (log) {
        const entry = log.entries[focusedRef.current];
        if (entry && entry.type === 'task') {
          updateEntry(dateRef.current, entry.id, { type: 'done' });
        } else if (entry && entry.type === 'done') {
          updateEntry(dateRef.current, entry.id, { type: 'task' });
        }
      }
    } else if (e.key === 'k' && focusedRef.current >= 0) {
      const log = logs[dateRef.current];
      if (log) {
        const entry = log.entries[focusedRef.current];
        if (entry && entry.type !== 'killed') {
          updateEntry(dateRef.current, entry.id, { type: 'killed' });
        }
      }
    } else if (e.key === '>' && focusedRef.current >= 0) {
      const log = logs[dateRef.current];
      if (log) {
        const entry = log.entries[focusedRef.current];
        if (entry && entry.type !== 'migrated') {
          updateEntry(dateRef.current, entry.id, { type: 'migrated' });
        }
      }
    } else if (e.key === 'Delete' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearDay(getTodayDateString());
      setFocusedIndex(-1);
    }
  }, [logs, updateEntry, clearDay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isToday = date === getTodayDateString();

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevDay} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleToday} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors text-sm font-medium">
            <CalendarIcon size={14} />
            Today
          </button>
          <button onClick={handleNextDay} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-2">
            {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM do')}
          </h1>
          {isToday && <p className="text-zinc-500 font-sans">{greeting}</p>}
        </div>

        <div className="space-y-1 mb-8">
          {dayLog.entries.length === 0 ? (
            <div className="text-zinc-600 italic py-4 text-sm">
              No entries yet. Start typing to capture.
            </div>
          ) : (
            [...dayLog.entries]
              .sort((a, b) => (ENTRY_SORT_ORDER[a.type] ?? 99) - (ENTRY_SORT_ORDER[b.type] ?? 99))
              .map((entry, idx) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                date={date}
                isFocused={focusedIndex === idx}
              />
            ))
          )}
        </div>
      </div>

      <div className="px-8 pb-8 pt-4 max-w-3xl mx-auto w-full">
        <InputBar date={date} />
      </div>
    </div>
  );
}
