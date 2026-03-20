import React, { useState, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { EntryItem } from './EntryItem';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { DailyLog, Entry, EntryType } from '../types';

interface SearchResult extends Entry {
  date: string;
}

export function SearchView() {
  const { searchVault, logs } = useVault();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      const allResults: SearchResult[] = [];
      for (const [date, log] of Object.entries(logs) as [string, DailyLog][]) {
        for (const entry of log.entries) {
          allResults.push({ ...entry, date });
        }
      }
      allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setResults(allResults);
      return;
    }

      const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const ipcResults = await searchVault(query);
        const mapped: SearchResult[] = ipcResults.map(e => ({ ...e, date: (e as any).source_date || '' }));
        setResults(mapped);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, logs, searchVault]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-6">
          Search
        </h1>
        <div className="relative flex items-center w-full bg-zinc-900/30 rounded-2xl overflow-hidden transition-all">
          <div className="pl-4 pr-2 text-zinc-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vault..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 py-4 px-2 font-sans placeholder:text-zinc-600 text-base"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        {query.trim() === '' ? (
          <div className="text-zinc-600 italic py-4 text-sm text-center">
            Type to search across all entries.
          </div>
        ) : isSearching ? (
          <div className="text-zinc-600 italic py-4 text-sm text-center">
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div className="text-zinc-600 italic py-4 text-sm text-center">
            No results found for "{query}".
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(
              results.reduce((acc, curr) => {
                if (!acc[curr.date]) acc[curr.date] = [];
                acc[curr.date].push(curr);
                return acc;
              }, {} as Record<string, SearchResult[]>)
            ) as [string, SearchResult[]][]).map(([date, entries]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-500 pb-1 mb-2">
                  {format(new Date(date + 'T12:00:00'), 'MMM do, yyyy')}
                </h3>
                {entries.map((entry) => (
                  <EntryItem
                    key={entry.id}
                    entry={entry}
                    date={date}
                    isFocused={false}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
