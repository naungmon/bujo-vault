import React, { useState, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { EntryItem } from './EntryItem';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthlyView() {
  const { logs, addMonthlyEntry, loadMonthly } = useVault();
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonthKey = format(currentDate, 'yyyy-MM');
  const monthLog = logs[currentMonthKey] || { date: currentMonthKey, entries: [] };
  const [value, setValue] = useState('');

  useEffect(() => {
    loadMonthly(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, loadMonthly]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      addMonthlyEntry(currentMonthKey, 'task', value.trim());
      setValue('');
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-2">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <p className="text-zinc-500 font-sans">Monthly Log</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-zinc-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-zinc-200 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        <div className="space-y-1 mb-8">
          {monthLog.entries.length === 0 ? (
            <div className="text-zinc-600 italic py-4 text-sm">
              No entries for this month yet.
            </div>
          ) : (
            monthLog.entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                date={currentMonthKey}
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
            placeholder="Add a monthly task..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 py-4 font-sans placeholder:text-zinc-600 text-base"
          />
        </div>
      </div>
    </div>
  );
}
