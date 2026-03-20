import React, { useEffect } from 'react';

const HELP_SECTIONS = [
  {
    title: 'Input Bar',
    items: [
      { key: 'Enter', desc: 'Submit entry' },
      { key: 'Shift+Enter', desc: 'New line (dump mode)' },
      { key: 'Ctrl+K', desc: 'Focus input bar' },
      { key: 'Escape', desc: 'Focus input bar' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { key: '↑ ↓', desc: 'Move through entries' },
      { key: 'x', desc: 'Mark selected done' },
      { key: 'k', desc: 'Kill selected' },
      { key: '>', desc: 'Migrate selected' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { key: 'Ctrl+Z', desc: 'Undo last change' },
      { key: 'Ctrl+Delete', desc: 'Clear all entries today' },
      { key: 'Ctrl+B', desc: 'Coaching insights' },
      { key: '?', desc: 'Toggle this help' },
    ],
  },
  {
    title: 'Prefixes',
    items: [
      { key: 't', desc: 'Task' },
      { key: 'n', desc: 'Note' },
      { key: 'e', desc: 'Event' },
      { key: '*', desc: 'Priority' },
      { key: 'x', desc: 'Done' },
      { key: 'k', desc: 'Kill' },
      { key: '>', desc: 'Migrated' },
      { key: '!', desc: 'Priority (suffix)' },
      { key: 'dump', desc: 'AI parse dump' },
    ],
  },
  {
    title: 'Views',
    items: [
      { key: 'Daily', desc: 'Today\'s entries' },
      { key: 'Monthly', desc: 'Monthly priorities' },
      { key: 'Future', desc: 'Parked items' },
      { key: 'Migration', desc: 'Review pending tasks' },
      { key: 'Review', desc: 'Analytics & insights' },
      { key: 'Coach', desc: 'Inline coaching (Ctrl+B)' },
      { key: 'Search', desc: 'Full vault search' },
      { key: 'Settings', desc: 'Configuration' },
    ],
  },
];

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-zinc-100">Keybindings</h2>
          <span className="text-xs text-zinc-500">Press ? or Escape to close</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {HELP_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs font-mono text-zinc-300 whitespace-nowrap">
                      {item.key}
                    </kbd>
                    <span className="text-xs text-zinc-400 text-right">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
