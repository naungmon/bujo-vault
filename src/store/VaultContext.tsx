import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DailyLog, Entry, EntryType, ViewType } from '../types';

interface VaultContextType {
  logs: Record<string, DailyLog>;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  addEntry: (date: string, type: EntryType, content: string) => void;
  addMonthlyEntry: (monthKey: string, type: EntryType, content: string) => void;
  addFutureEntry: (monthLabel: string, content: string) => void;
  updateEntry: (date: string, id: string, updates: Partial<Entry>) => void;
  deleteEntry: (date: string, id: string) => void;
  clearDay: (date: string) => void;
  addMultipleEntries: (date: string, entries: { type: EntryType; content: string }[]) => void;
  migrateEntry: (entryId: string, fromDate: string, toDate: string) => void;
  undo: () => void;
  loadMonthly: (year: number, month: number) => void;
  loadFuture: () => void;
  searchVault: (query: string) => Promise<Entry[]>;
  streak: number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.bujo !== undefined;
}

function mapEntries(rawEntries: Array<{ id: string; type: string; content: string; timestamp: number }>): Entry[] {
  return rawEntries.map(e => ({
    id: e.id,
    type: e.type as EntryType,
    content: e.content,
    timestamp: e.timestamp,
  }));
}

async function reloadAndMap(getter: () => Promise<any>, key: string, setLogs: React.Dispatch<React.SetStateAction<Record<string, DailyLog>>>) {
  const data = await getter();
  setLogs(prev => ({
    ...prev,
    [key]: {
      date: data.date,
      entries: mapEntries(data.entries),
    },
  }));
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [isLoaded, setIsLoaded] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadDailyLogs = useCallback(async () => {
    if (!isElectron()) return;
    try {
      const range = await window.bujo.getRange(30);
      const newLogs: Record<string, DailyLog> = {};
      for (const day of range) {
        newLogs[day.date] = {
          date: day.date,
          entries: mapEntries(day.entries),
        };
      }
      setLogs(prev => ({ ...prev, ...newLogs }));
      const s = await window.bujo.analyticsStreak();
      setStreak(s);
    } catch (err) {
      console.error('Failed to load daily logs:', err);
    }
  }, []);

  useEffect(() => {
    if (isElectron()) {
      window.bujo.vaultEnsure().then(() => {
        return loadDailyLogs();
      }).then(() => {
        return window.bujo.startListening();
      }).then(() => {
        setIsLoaded(true);
      }).catch(err => {
        console.error('Failed to initialize vault:', err);
        setIsLoaded(true);
      });

      const unsubscribe = window.bujo.onVaultChanged((label: string) => {
        if (label.startsWith('day:')) {
          const date = label.slice(4);
          reloadDay(date);
        } else {
          loadDailyLogs();
        }
      });

      return () => unsubscribe();
    } else {
      setIsLoaded(true);
    }
  }, [loadDailyLogs]);

  const reloadDay = async (date: string) => {
    if (!isElectron()) return;
    try {
      const day = await window.bujo.getDay(date);
      setLogs(prev => ({
        ...prev,
        [date]: {
          date: day.date,
          entries: mapEntries(day.entries),
        },
      }));
    } catch (err) {
      console.error('Failed to reload day:', err);
    }
  };

  const addEntry = async (date: string, type: EntryType, content: string) => {
    if (isElectron()) {
      await window.bujo.appendEntry(date, type, content);
      await reloadAndMap(() => window.bujo.getDay(date), date, setLogs);
      setStreak(await window.bujo.analyticsStreak());
    } else {
      setLogs((prev) => {
        const dayLog = prev[date] || { date, entries: [] };
        const newEntry: Entry = {
          id: crypto.randomUUID(),
          type,
          content,
          timestamp: Date.now(),
        };
        return {
          ...prev,
          [date]: {
            ...dayLog,
            entries: [...dayLog.entries, newEntry],
          },
        };
      });
    }
  };

  const addMonthlyEntry = async (monthKey: string, type: EntryType, content: string) => {
    if (isElectron()) {
      await window.bujo.appendMonthlyEntry(monthKey, type, content);
      await reloadAndMap(
        () => window.bujo.getMonthly(parseInt(monthKey.slice(0, 4)), parseInt(monthKey.slice(5, 7))),
        monthKey, setLogs
      );
    } else {
      setLogs((prev) => {
        const dayLog = prev[monthKey] || { date: monthKey, entries: [] };
        return {
          ...prev,
          [monthKey]: {
            ...dayLog,
            entries: [...dayLog.entries, {
              id: crypto.randomUUID(),
              type,
              content,
              timestamp: Date.now(),
            }],
          },
        };
      });
    }
  };

  const addFutureEntry = async (monthLabel: string, content: string) => {
    if (isElectron()) {
      await window.bujo.appendFutureEntry(monthLabel, content);
      await loadFuture();
    } else {
      const key = monthLabel + '-future';
      setLogs((prev) => {
        const dayLog = prev[key] || { date: key, entries: [] };
        return {
          ...prev,
          [key]: {
            ...dayLog,
            entries: [...dayLog.entries, {
              id: crypto.randomUUID(),
              type: 'task' as EntryType,
              content,
              timestamp: Date.now(),
            }],
          },
        };
      });
    }
  };

  const updateEntry = async (date: string, id: string, updates: Partial<Entry>) => {
    if (isElectron()) {
      const dayLog = logs[date];
      if (!dayLog) return;
      const entry = dayLog.entries.find(e => e.id === id);
      if (!entry) return;
      await window.bujo.updateEntry(date, id, updates.type || entry.type, updates.content || entry.content);
      await reloadAndMap(() => window.bujo.getDay(date), date, setLogs);
    } else {
      setLogs((prev) => {
        const dayLog = prev[date];
        if (!dayLog) return prev;
        return {
          ...prev,
          [date]: {
            ...dayLog,
            entries: dayLog.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          },
        };
      });
    }
  };

  const deleteEntry = async (date: string, id: string) => {
    if (isElectron()) {
      await window.bujo.deleteEntry(date, id);
      await reloadAndMap(() => window.bujo.getDay(date), date, setLogs);
    } else {
      setLogs((prev) => {
        const dayLog = prev[date];
        if (!dayLog) return prev;
        return {
          ...prev,
          [date]: {
            ...dayLog,
            entries: dayLog.entries.filter((e) => e.id !== id),
          },
        };
      });
    }
  };

  const clearDay = async (date: string) => {
    if (isElectron()) await window.bujo.clearDay(date);
    setLogs(prev => {
      const newLogs = { ...prev };
      delete newLogs[date];
      return newLogs;
    });
  };

  const addMultipleEntries = async (date: string, entries: { type: EntryType; content: string }[]) => {
    for (const entry of entries) {
      await addEntry(date, entry.type, entry.content);
    }
  };

  const migrateEntry = async (entryId: string, fromDate: string, toDate: string) => {
    if (isElectron()) {
      await window.bujo.migrateEntry(fromDate, toDate, entryId);
      await reloadDay(fromDate);
      await reloadDay(toDate);
    } else {
      setLogs((prev) => {
        const sourceLog = prev[fromDate];
        if (!sourceLog) return prev;

        const entryIndex = sourceLog.entries.findIndex(e => e.id === entryId);
        if (entryIndex === -1) return prev;

        const entry = sourceLog.entries[entryIndex];
        const updatedSourceEntries = [...sourceLog.entries];

        updatedSourceEntries[entryIndex] = { ...entry, type: 'migrated' };

        const targetLog = prev[toDate] || { date: toDate, entries: [] };

        const newEntry: Entry = {
          ...entry,
          id: crypto.randomUUID(),
          type: entry.type === 'migrated' ? 'task' : entry.type,
          timestamp: Date.now()
        };

        return {
          ...prev,
          [fromDate]: { ...sourceLog, entries: updatedSourceEntries },
          [toDate]: { ...targetLog, entries: [...targetLog.entries, newEntry] }
        };
      });
    }
  };

  const undo = useCallback(async () => {
    if (isElectron()) {
      const result = await window.bujo.undo();
      if (result.error) {
        console.error('Undo failed:', result.error);
        return;
      }
      const match = result.filePath.match(/[\\/]daily[\\/](.+)\.md$/);
      if (match) {
        await reloadDay(match[1]);
      }
    }
  }, []);

  const loadMonthly = useCallback(async (year: number, month: number) => {
    if (!isElectron()) return;
    const monthData = await window.bujo.getMonthly(year, month);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    setLogs(prev => ({
      ...prev,
      [monthKey]: {
        date: monthData.date,
        entries: mapEntries(monthData.entries),
      },
    }));
  }, []);

  const loadFuture = useCallback(async () => {
    if (!isElectron()) return;
    const futureData = await window.bujo.getFuture();
    const newLogs: Record<string, DailyLog> = {};
    for (const [monthKey, items] of Object.entries(futureData)) {
      const key = monthKey + '-future';
      newLogs[key] = {
        date: key,
        entries: items.map(content => ({
          id: crypto.randomUUID(),
          type: 'task' as EntryType,
          content,
          timestamp: Date.now(),
        })),
      };
    }
    setLogs(prev => ({ ...prev, ...newLogs }));
  }, []);

  const searchVault = async (query: string): Promise<Entry[]> => {
    if (isElectron()) {
      const results = await window.bujo.search(query);
      return results.map(e => ({
        id: e.id,
        type: e.type as EntryType,
        content: e.content,
        timestamp: e.timestamp,
        source_date: e.source_date,
      })) as any;
    }
    return [];
  };

  if (!isLoaded) return null;

  return (
    <VaultContext.Provider
      value={{
        logs,
        currentView,
        setCurrentView,
        addEntry,
        addMonthlyEntry,
        addFutureEntry,
        updateEntry,
        deleteEntry,
        clearDay,
        addMultipleEntries,
        migrateEntry,
        undo,
        loadMonthly,
        loadFuture,
        searchVault,
        streak,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
