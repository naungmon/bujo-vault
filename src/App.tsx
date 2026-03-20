import React, { useState, useEffect } from 'react';
import { VaultProvider, useVault } from './store/VaultContext';
import { Sidebar } from './components/Sidebar';
import { DailyView } from './components/DailyView';
import { SearchView } from './components/SearchView';
import { ReviewView } from './components/ReviewView';
import { SettingsView } from './components/SettingsView';
import { MonthlyView } from './components/MonthlyView';
import { FutureLog } from './components/FutureLog';
import { MigrationView } from './components/MigrationView';
import { CoachView } from './components/CoachView';
import { HelpOverlay } from './components/HelpOverlay';

function MainContent() {
  const { currentView } = useVault();
  const [showHelp, setShowHelp] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowCoach(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowHelp(false);
        setShowCoach(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (showHelp) {
    return <HelpOverlay onClose={() => setShowHelp(false)} />;
  }

  if (showCoach) {
    return <CoachView onClose={() => setShowCoach(false)} />;
  }

  return (
    <div className="flex-1 h-full overflow-hidden bg-zinc-950">
      {currentView === 'daily' && <DailyView />}
      {currentView === 'monthly' && <MonthlyView />}
      {currentView === 'future' && <FutureLog />}
      {currentView === 'migration' && <MigrationView />}
      {currentView === 'review' && <ReviewView />}
      {currentView === 'search' && <SearchView />}
      {currentView === 'settings' && <SettingsView />}
      {currentView === 'coach' && <CoachView onClose={() => {}} />}
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden selection:bg-indigo-500/30">
        <Sidebar />
        <MainContent />
      </div>
    </VaultProvider>
  );
}
