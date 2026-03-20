import React, { useState, useRef, useEffect } from 'react';
import { Entry, EntryType } from '../types';
import { cn } from '../lib/utils';
import { useVault } from '../store/VaultContext';

interface EntryItemProps {
  key?: string;
  entry: Entry;
  date: string;
  isFocused: boolean;
}

const SYMBOLS: Record<EntryType, string> = {
  task: '·',
  done: '×',
  migrated: '>',
  killed: '~',
  note: '–',
  event: '○',
  scheduled: '<',
  priority: '★',
};

const COLORS: Record<EntryType, string> = {
  task: 'text-zinc-300',
  done: 'text-zinc-500 line-through',
  migrated: 'text-indigo-400',
  killed: 'text-red-400/50 line-through',
  note: 'text-zinc-400',
  event: 'text-emerald-400',
  scheduled: 'text-amber-400',
  priority: 'text-yellow-400 font-bold',
};

export function EntryItem({ entry, date, isFocused }: EntryItemProps) {
  const { updateEntry, deleteEntry } = useVault();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.content);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateEntry(date, entry.id, { content: editValue });
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      cancelledRef.current = true;
      setEditValue(entry.content);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (!cancelledRef.current) {
      updateEntry(date, entry.id, { content: editValue });
    }
    cancelledRef.current = false;
    setIsEditing(false);
  };

  const toggleStatus = () => {
    if (entry.type === 'task') updateEntry(date, entry.id, { type: 'done' });
    else if (entry.type === 'done') updateEntry(date, entry.id, { type: 'task' });
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: entry.id, date }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={cn(
        "group flex items-start gap-3 py-1.5 px-2 rounded-md transition-colors cursor-grab active:cursor-grabbing",
        isFocused ? "bg-zinc-800/50" : "hover:bg-zinc-800/30"
      )}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div 
        className={cn(
          "w-5 text-center font-mono select-none cursor-pointer",
          COLORS[entry.type]
        )}
        onClick={toggleStatus}
      >
        {SYMBOLS[entry.type]}
      </div>
      
      <div className="flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full bg-transparent border-none outline-none text-zinc-100 font-sans"
          />
        ) : (
          <span className={cn("font-sans text-[15px]", COLORS[entry.type])}>
            {entry.content}
          </span>
        )}
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs text-zinc-500 transition-opacity">
        <button onClick={() => updateEntry(date, entry.id, { type: 'migrated' })} className="hover:text-indigo-400" title="Migrate">&gt;</button>
        <button onClick={() => updateEntry(date, entry.id, { type: 'killed' })} className="hover:text-red-400" title="Kill">~</button>
        <button onClick={() => deleteEntry(date, entry.id)} className="hover:text-red-500" title="Delete">×</button>
      </div>
    </div>
  );
}
