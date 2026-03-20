import React, { useMemo } from 'react';
import { useVault } from '../store/VaultContext';
import { CoachAnalysis } from '../types';
import { getTodayDateString } from '../lib/utils';

const QUESTIONS = [
  "What's the one thing you'll remember from today?",
  "If you had to kill one task, which would it be?",
  "What are you avoiding right now?",
  "Which task would feel best to complete today?",
  "What would make tomorrow easier?",
  "Are you working on what matters or what's urgent?",
  "What would you tell someone in your situation?",
  "Is there something you've migrated more than twice?",
  "What's the smallest next step on your hardest task?",
  "Are you capturing or processing right now?",
];

function getMomentum(analysis: Pick<CoachAnalysis, 'completionRate' | 'migrated' | 'tasks'>): CoachAnalysis['momentum'] {
  if (analysis.completionRate >= 70) return 'building';
  if (analysis.completionRate >= 40) return 'steady';
  if (analysis.completionRate >= 20) return 'stalling';
  return 'stalled';
}

function getKillThemes(logs: Record<string, import('../types').DailyLog>): string[] {
  const killed: Record<string, number> = {};
  for (const log of Object.values(logs)) {
    for (const entry of log.entries) {
      if (entry.type === 'killed') {
        const words = entry.content.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length > 3) {
            killed[w] = (killed[w] || 0) + 1;
          }
        }
      }
    }
  }
  return Object.entries(killed)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

function getStuckTasks(logs: Record<string, import('../types').DailyLog>): string[] {
  const migrateCount: Record<string, number> = {};
  for (const log of Object.values(logs)) {
    for (const entry of log.entries) {
      if (entry.type === 'migrated') {
        migrateCount[entry.content] = (migrateCount[entry.content] || 0) + 1;
      }
    }
  }
  return Object.entries(migrateCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([content]) => content);
}

interface CoachViewProps {
  onClose: () => void;
}

export function CoachView({ onClose }: CoachViewProps) {
  const { logs, streak } = useVault();
  const today = getTodayDateString();

  const analysis: CoachAnalysis = useMemo(() => {
    const dayLog = logs[today] || { date: today, entries: [] };
    const entries = dayLog.entries;
    const tasks = entries.filter(e => e.type === 'task').length;
    const done = entries.filter(e => e.type === 'done').length;
    const killed = entries.filter(e => e.type === 'killed').length;
    const migrated = entries.filter(e => e.type === 'migrated').length;
    const priorities = entries.filter(e => e.type === 'priority').length;
    const totalEntries = entries.length;
    const completionRate = (tasks + done) > 0 ? Math.round((done / (tasks + done)) * 100) : 0;

    const stuckTasks = getStuckTasks(logs);
    const killThemes = getKillThemes(logs);
    const momentum = getMomentum({ completionRate, migrated, tasks: tasks + done });

    const questionIndex = (today.charCodeAt(0) + today.charCodeAt(today.length - 1) + totalEntries) % QUESTIONS.length;
    const question = QUESTIONS[questionIndex];

    return {
      totalEntries,
      tasks,
      done,
      killed,
      migrated,
      priorities,
      completionRate,
      momentum,
      streak,
      stuckTasks,
      killThemes,
      question,
    };
  }, [logs, today, streak]);

  if (analysis.totalEntries < 5) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            <p className="text-2xl font-serif text-zinc-300 mb-4">
              {analysis.totalEntries === 0
                ? "Nothing captured yet today."
                : analysis.totalEntries === 1
                ? "One entry. Keep going."
                : `${analysis.totalEntries} entries. You're warming up.`}
            </p>
            <p className="text-sm text-zinc-500">
              {streak >= 3
                ? `${streak} day streak. Don't break it.`
                : streak === 0
                ? "Start your streak today."
                : "Capture 5+ entries to unlock coaching."}
            </p>
            <p className="text-xs text-zinc-600 mt-6">Press Escape to close</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${
              analysis.momentum === 'building' ? 'bg-emerald-500/20 text-emerald-400' :
              analysis.momentum === 'steady' ? 'bg-blue-500/20 text-blue-400' :
              analysis.momentum === 'stalling' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {analysis.momentum}
            </span>
            <span className="text-zinc-500 text-sm">{analysis.completionRate}% completion today</span>
            {streak >= 3 && (
              <span className="text-zinc-500 text-sm">{streak} day streak</span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900/30 rounded-xl p-4">
              <div className="text-2xl font-light text-zinc-100">{analysis.tasks}</div>
              <div className="text-xs text-zinc-500">pending</div>
            </div>
            <div className="bg-zinc-900/30 rounded-xl p-4">
              <div className="text-2xl font-light text-emerald-400">{analysis.done}</div>
              <div className="text-xs text-zinc-500">done</div>
            </div>
            <div className="bg-zinc-900/30 rounded-xl p-4">
              <div className="text-2xl font-light text-indigo-400">{analysis.migrated}</div>
              <div className="text-xs text-zinc-500">migrated</div>
            </div>
            <div className="bg-zinc-900/30 rounded-xl p-4">
              <div className="text-2xl font-light text-red-400">{analysis.killed}</div>
              <div className="text-xs text-zinc-500">killed</div>
            </div>
          </div>

          {analysis.stuckTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Stuck tasks</h3>
              <div className="space-y-1">
                {analysis.stuckTasks.map((task, i) => (
                  <div key={i} className="text-sm text-amber-400 flex items-center gap-2">
                    <span className="text-amber-600">&gt;</span>
                    {task}
                    <span className="text-zinc-600 text-xs">(migrated {2 + i}x)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.killThemes.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Kill themes</h3>
              <div className="flex gap-2">
                {analysis.killThemes.map((theme, i) => (
                  <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-6">
            <p className="text-lg font-serif text-zinc-200">{analysis.question}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
