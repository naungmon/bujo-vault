import React, { useState, useRef, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { EntryType } from '../types';
import { parseDump } from '../services/ai';
import { Sparkles, Loader2, Command } from 'lucide-react';

interface InputBarProps {
  date: string;
}

const PREFIX_MAP: Record<string, EntryType> = {
  't ': 'task',
  'task ': 'task',
  'n ': 'note',
  'note ': 'note',
  'e ': 'event',
  'event ': 'event',
  '* ': 'priority',
  'p ': 'priority',
  'priority ': 'priority',
  'x ': 'done',
  'done ': 'done',
  'k ': 'killed',
  'kill ': 'killed',
  '> ': 'migrated',
  '< ': 'scheduled',
};

export function InputBar({ date }: InputBarProps) {
  const { addEntry, addMultipleEntries } = useVault();
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      const text = value.trim();
      
      let isDump = text.toLowerCase().startsWith('dump ');
      let dumpText = isDump ? text.substring(5).trim() : text;
      
      if (!isDump) {
        let hasPrefix = false;
        for (const prefix of Object.keys(PREFIX_MAP)) {
          if (text.toLowerCase().startsWith(prefix)) {
            hasPrefix = true;
            break;
          }
        }
        
        // Auto-detect brain dump: no prefix, > 60 chars, and contains multiple clauses/sentences
        if (!hasPrefix && text.length > 60 && (text.split(',').length > 2 || text.split('.').length > 1 || text.split(' and ').length > 1)) {
          isDump = true;
        }
      }

      if (isDump) {
        setIsProcessing(true);
        try {
          const parsed = await parseDump(dumpText);
          if (parsed && parsed.length > 0) {
            addMultipleEntries(date, parsed);
          } else {
            // Fallback if AI fails to parse
            addEntry(date, 'note', dumpText);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to parse dump. Check your API key in Settings.");
        } finally {
          setIsProcessing(false);
          setValue('');
        }
        return;
      }

      // Check for prefixes
      let type: EntryType = 'note';
      let content = text;

      for (const [prefix, mappedType] of Object.entries(PREFIX_MAP)) {
        if (text.toLowerCase().startsWith(prefix)) {
          type = mappedType;
          content = text.substring(prefix.length).trim();
          break;
        }
      }

      // Check for suffix priority
      if (content.endsWith('!')) {
        type = 'priority';
        content = content.slice(0, -1).trim();
      } else if (content.toLowerCase().endsWith(' important')) {
        type = 'priority';
        content = content.slice(0, -10).trim();
      } else if (content.toLowerCase().endsWith(' urgent')) {
        type = 'priority';
        content = content.slice(0, -7).trim();
      }

      addEntry(date, type, content);
      setValue('');
      setError('');
    }
  };

  return (
    <div className="relative group w-full">
      <div className="relative flex items-center w-full transition-all bg-zinc-900/30 rounded-2xl px-4">
        <div className="pr-3 text-zinc-600 flex items-center justify-center">
          {isProcessing ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <Command size={18} className="text-zinc-700" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder="Type entry (t task, n note) or paste a long brain dump for AI parsing..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-100 py-4 font-sans placeholder:text-zinc-600 disabled:opacity-50 text-base"
        />
        <div className="pl-3 flex items-center gap-3 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-zinc-600">
            <Command size={10} /> K
          </div>
          <Sparkles size={16} className={`transition-colors ${value.toLowerCase().startsWith('dump ') || (value.length > 60 && !Object.keys(PREFIX_MAP).some(p => value.toLowerCase().startsWith(p))) ? 'text-zinc-300' : 'text-zinc-700'}`} />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2 px-4">{error}</p>}
    </div>
  );
}
