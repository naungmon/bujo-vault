import React, { useState, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { EntryItem } from './EntryItem';
import { format, addMonths } from 'date-fns';

export function FutureLog() {
  const { logs, addFutureEntry, loadFuture } = useVault();
  const [value, setValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(addMonths(new Date(), 1), 'yyyy-MM'));

  useEffect(() => {
    loadFuture();
  }, [loadFuture]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = addMonths(new Date(), i + 1);
    return {
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy'),
    };
  });

  const futureLogKey = selectedMonth + '-future';
  const futureLog = logs[futureLogKey] || { date: futureLogKey, entries: [] };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      const monthLabel = months.find(m => m.key === selectedMonth)?.label || selectedMonth;
      addFutureEntry(monthLabel, value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-2">
          Future Log
        </h1>
        <p className="text-zinc-500 font-sans">Upcoming Months</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {months.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMonth(m.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedMonth === m.key
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-1 mb-8">
          {futureLog.entries.length === 0 ? (
            <div className="text-zinc-600 italic py-4 text-sm">
              No entries for {months.find(m => m.key === selectedMonth)?.label} yet.
            </div>
          ) : (
            futureLog.entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                date={futureLogKey}
                isFocused={false}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="px-8 pb-8 pt-4 max-w-3xl mx-auto w-full">
        <div className="relative flex items-center w-full transition-all bg-zinc-900/30 rounded-2xl px-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add a task for ${months.find(m => m.key === selectedMonth)?.label}...`}
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 py-4 font-sans placeholder:text-zinc-600 text-base"
          />
        </div>
      </div>
    </div>
  );
}
