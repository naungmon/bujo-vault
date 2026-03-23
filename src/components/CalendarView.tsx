import React, { useState, useMemo } from 'react';
import { useVault } from '../store/VaultContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateString } from '../lib/utils';
import { DailyLog } from '../types';

export function CalendarView() {
  const { logs, setCurrentView } = useVault();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [calStart.getTime(), calEnd.getTime()]);

  const entryMap = useMemo(() => {
    const map: Record<string, { count: number; hasPriority: boolean; hasDone: boolean }> = {};
    for (const [date, log] of Object.entries(logs) as [string, DailyLog][]) {
      if (date.includes('-monthly') || date.includes('-future')) continue;
      map[date] = {
        count: log.entries.length,
        hasPriority: log.entries.some(e => e.type === 'priority'),
        hasDone: log.entries.some(e => e.type === 'done'),
      };
    }
    return map;
  }, [logs]);

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Navigate to daily view — we need to communicate the date
    // For now, we set a window property that DailyView can read
    (window as any).__bujoNavigateDate = dateStr;
    setCurrentView('daily');
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => setCurrentMonth(new Date());

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors text-sm font-medium">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        <div className="bg-zinc-900/30 rounded-2xl p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs text-zinc-500 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const entry = entryMap[dateStr];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const todayStr = getTodayDateString();
              const isTodayDate = dateStr === todayStr;

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative aspect-square rounded-lg flex flex-col items-center justify-center
                    text-sm transition-colors
                    ${inMonth ? 'text-zinc-200 hover:bg-zinc-800/50' : 'text-zinc-700 hover:bg-zinc-800/30'}
                    ${isTodayDate ? 'bg-zinc-800/60 ring-1 ring-zinc-600' : ''}
                  `}
                >
                  <span className={isTodayDate ? 'text-zinc-100 font-medium' : ''}>
                    {format(day, 'd')}
                  </span>
                  {entry && entry.count > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {entry.hasPriority && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                      {entry.hasDone && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                      {!entry.hasPriority && !entry.hasDone && <span className="w-1 h-1 rounded-full bg-zinc-400" />}
                      {entry.count > 0 && !entry.hasPriority && !entry.hasDone && (
                        <span className="text-[9px] text-zinc-500 ml-0.5">{entry.count}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 px-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Has priorities
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Has completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Has entries
          </div>
        </div>
      </div>
    </div>
  );
}
