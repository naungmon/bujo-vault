import React, { useState, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { Calendar, CalendarDays, Search, Settings, FileText, BarChart, Flame, ArrowRight, ArrowLeftRight, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewType } from '../types';
import { format, addDays, addMonths } from 'date-fns';

export function Sidebar() {
  const { currentView, setCurrentView, logs, migrateEntry, undo, streak } = useVault();
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.id && data.date) {
        let targetDate = '';
        if (targetId === 'tomorrow') {
          const tomorrow = addDays(new Date(), 1);
          targetDate = format(tomorrow, 'yyyy-MM-dd');
        } else if (targetId === 'monthly') {
          targetDate = format(new Date(), 'yyyy-MM') + '-monthly';
        } else if (targetId === 'future') {
          targetDate = format(addMonths(new Date(), 1), 'yyyy-MM') + '-future';
        }

        if (targetDate && data.date !== targetDate) {
          migrateEntry(data.id, data.date, targetDate);
        }
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  const navItems: { id: ViewType | 'tomorrow'; label: string; icon: React.ReactNode; isDropTarget?: boolean }[] = [
    { id: 'daily', label: 'Daily Log', icon: <FileText size={18} /> },
    { id: 'tomorrow', label: 'Migrate to Tomorrow', icon: <ArrowRight size={18} />, isDropTarget: true },
    { id: 'monthly', label: 'Monthly Log', icon: <CalendarDays size={18} />, isDropTarget: true },
    { id: 'future', label: 'Future Log', icon: <Calendar size={18} />, isDropTarget: true },
    { id: 'migration', label: 'Migration', icon: <ArrowLeftRight size={18} /> },
    { id: 'review', label: 'Review', icon: <BarChart size={18} /> },
    { id: 'coach', label: 'Coach', icon: <Brain size={18} /> },
    { id: 'search', label: 'Search', icon: <Search size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  // Ctrl+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="w-64 bg-zinc-950 flex flex-col h-full text-zinc-400 select-none">
      <div className="p-6 flex items-center justify-between font-serif text-xl text-zinc-100">
        <div className="flex items-center gap-2 tracking-tight">
          BuJo
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-xs font-sans font-medium text-zinc-500" title={`${streak} Day Streak`}>
            <Flame size={12} />
            {streak}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-1">
        {navItems.map((item) => {
          if (item.id === 'tomorrow') {
            return (
              <div
                key={item.id}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-transparent",
                  dragOverId === item.id ? "bg-zinc-900 text-zinc-300 border-zinc-800 border-dashed" : "text-zinc-600"
                )}
              >
                {item.icon}
                {item.label}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              onDragOver={item.isDropTarget ? (e) => handleDragOver(e, item.id) : undefined}
              onDragLeave={item.isDropTarget ? handleDragLeave : undefined}
              onDrop={item.isDropTarget ? (e) => handleDrop(e, item.id) : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-transparent",
                dragOverId === item.id
                  ? "bg-zinc-900 text-zinc-300 border-zinc-800 border-dashed"
                  : currentView === item.id
                  ? "text-zinc-100 bg-zinc-900/50"
                  : "hover:text-zinc-200"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
