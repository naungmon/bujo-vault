import React, { useMemo, useState, useEffect } from 'react';
import { useVault } from '../store/VaultContext';
import { BarChart, CheckCircle, ArrowRight, XCircle, Star, Calendar, Brain, Sparkles, Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { DailyLog } from '../types';
import { format, subMonths, addMonths } from 'date-fns';

const PERSPECTIVES = [
  { id: 'chronicle', label: 'Chronicle', icon: <FileText size={16} />, desc: 'What happened' },
  { id: 'coach', label: 'Coach', icon: <Brain size={16} />, desc: 'Goals & momentum' },
  { id: 'relationships', label: 'Relationships', icon: <FileText size={16} />, desc: 'Connection & isolation' },
  { id: 'strengths', label: 'Strengths', icon: <Star size={16} />, desc: 'Evidence-based positives' },
  { id: 'therapist', label: 'Therapist', icon: <FileText size={16} />, desc: 'Emotional patterns' },
  { id: 'values-meaning', label: 'Values & Meaning', icon: <FileText size={16} />, desc: 'Alignment & purpose' },
  { id: 'synthesis', label: 'Synthesis', icon: <Sparkles size={16} />, desc: 'Combined report' },
];

export function ReviewView() {
  const { logs, streak } = useVault();
  const [weekly, setWeekly] = useState<{
    totalEntries: number; done: number; killed: number; migrated: number;
    tasks: number; streak: number; completionRate: number
  } | null>(null);
  const [tab, setTab] = useState<'analytics' | 'review'>('analytics');

  useEffect(() => {
    if (window.bujo) {
      window.bujo.analyticsWeekly().then(setWeekly).catch(console.error);
    }
  }, []);

  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let migratedTasks = 0;
    let killedTasks = 0;
    let totalPriorities = 0;
    let totalDays = Object.keys(logs).length;

    (Object.values(logs) as DailyLog[]).forEach((log) => {
      log.entries.forEach((entry) => {
        if (entry.type === 'task' || entry.type === 'done') totalTasks++;
        if (entry.type === 'done') completedTasks++;
        if (entry.type === 'migrated') migratedTasks++;
        if (entry.type === 'killed') killedTasks++;
        if (entry.type === 'priority') totalPriorities++;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgTasksPerDay = totalDays > 0 ? (totalTasks / totalDays).toFixed(1) : '0';

    return { totalTasks, completedTasks, migratedTasks, killedTasks, completionRate, avgTasksPerDay, totalPriorities, totalDays };
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="px-8 pt-12 pb-4 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-serif font-light tracking-tight text-zinc-100 mb-4">Review</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'analytics' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>Analytics</button>
          <button onClick={() => setTab('review')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'review' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>Monthly Review</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4 max-w-3xl mx-auto w-full">
        {tab === 'analytics' ? (
          <AnalyticsTab stats={stats} weekly={weekly} />
        ) : (
          <MonthlyReviewTab />
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ stats, weekly }: { stats: any; weekly: any }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<CheckCircle size={18} className="text-emerald-400" />} title="Completion Rate" value={`${stats.completionRate}%`} />
        <StatCard icon={<Calendar size={18} className="text-zinc-400" />} title="Avg Tasks / Day" value={stats.avgTasksPerDay} />
        <StatCard icon={<Star size={18} className="text-yellow-400" />} title="Priorities Logged" value={stats.totalPriorities.toString()} />
        <StatCard icon={<BarChart size={18} className="text-indigo-400" />} title="Total Tasks" value={stats.totalTasks.toString()} />
        <StatCard icon={<ArrowRight size={18} className="text-indigo-400" />} title="Migrated" value={stats.migratedTasks.toString()} />
        <StatCard icon={<XCircle size={18} className="text-red-400" />} title="Killed" value={stats.killedTasks.toString()} />
      </div>

      {weekly && (
        <div className="p-6 bg-zinc-900/30 rounded-2xl mb-6">
          <h2 className="text-lg font-medium text-zinc-100 mb-4 flex items-center gap-2"><Calendar size={18} className="text-emerald-400" />This Week</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><div className="text-2xl font-light text-zinc-100">{weekly.totalEntries}</div><div className="text-xs text-zinc-500">entries</div></div>
            <div><div className="text-2xl font-light text-emerald-400">{weekly.done}</div><div className="text-xs text-zinc-500">done</div></div>
            <div><div className="text-2xl font-light text-indigo-400">{weekly.migrated}</div><div className="text-xs text-zinc-500">migrated</div></div>
            <div><div className="text-2xl font-light text-red-400">{weekly.killed}</div><div className="text-xs text-zinc-500">killed</div></div>
          </div>
          <p className="text-zinc-400 text-sm">
            {weekly.completionRate}% completion rate this week.
            {weekly.streak >= 3 && ` ${weekly.streak} day streak.`}
            {weekly.totalEntries === 0 ? "Start capturing to build momentum." :
             weekly.completionRate > 70 ? "Strong momentum. Keep it up." :
             weekly.completionRate > 40 ? "Steady progress. Consider killing tasks you keep migrating." :
             "Focus on 1-3 priorities per day."}
          </p>
        </div>
      )}

      <div className="p-6 bg-zinc-900/30 rounded-2xl">
        <h2 className="text-lg font-medium text-zinc-100 mb-4 flex items-center gap-2"><BarChart size={18} className="text-indigo-400" />Momentum Insights</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          {stats.totalDays === 0 ? "You haven't logged any days yet. Start capturing to see insights." :
           stats.completionRate > 70 ? "You're maintaining strong momentum. Your completion rate is excellent. Keep focusing on what matters." :
           stats.completionRate > 40 ? "You're making steady progress. Consider if you're overcommitting. It's okay to kill tasks that no longer serve you." :
           "It looks like you're capturing a lot but completing less. Try to focus on just 1-3 priorities per day to build momentum."}
        </p>
      </div>
    </>
  );
}

function MonthlyReviewTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = format(currentMonth, 'yyyy-MM');
  const monthLabel = format(currentMonth, 'MMMM yyyy');

  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [activePerspective, setActivePerspective] = useState<string>('chronicle');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.bujo) {
      window.bujo.reviewList(monthKey).then(setStatus).catch(console.error);
    }
  }, [monthKey]);

  useEffect(() => {
    if (window.bujo && status[activePerspective]) {
      setIsLoading(true);
      window.bujo.reviewGet(monthKey, activePerspective).then(({ content: c }) => {
        setContent(c);
      }).catch(console.error).finally(() => setIsLoading(false));
    } else {
      setContent('');
    }
  }, [monthKey, activePerspective, status]);

  const handleGenerate = async (perspective: string) => {
    if (!window.bujo) return;
    setIsGenerating(true);
    setError('');

    try {
      const result = perspective === 'synthesis'
        ? await window.bujo.reviewSynthesize(monthKey)
        : await window.bujo.reviewPerspective(monthKey, perspective);

      if (result.error) {
        setError(result.error);
      } else {
        setContent(result.content);
        setStatus(await window.bujo.reviewList(monthKey));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const availableCount = Object.values(status).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-zinc-300">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors"><ChevronRight size={18} /></button>
        </div>
        <span className="text-xs text-zinc-500">{availableCount}/7 perspectives generated</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PERSPECTIVES.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePerspective(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePerspective === p.id ? 'bg-zinc-800 text-zinc-100' :
              status[p.id] ? 'text-zinc-300 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400'
            }`}
          >
            {p.icon}
            {p.label}
            {status[p.id] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-medium text-zinc-100">{PERSPECTIVES.find(p => p.id === activePerspective)?.label}</h3>
            <p className="text-xs text-zinc-500">{PERSPECTIVES.find(p => p.id === activePerspective)?.desc}</p>
          </div>
          <button
            onClick={() => handleGenerate(activePerspective)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {status[activePerspective] ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed">{content}</pre>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm mb-2">No analysis generated yet</p>
            <p className="text-zinc-600 text-xs">Click Generate to analyze your {monthLabel} entries from the {PERSPECTIVES.find(p => p.id === activePerspective)?.label} perspective</p>
          </div>
        )}
      </div>

      {activePerspective !== 'synthesis' && availableCount >= 3 && !status['synthesis'] && (
        <div className="bg-indigo-500/10 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Ready for synthesis</p>
            <p className="text-xs text-zinc-400">Combine all perspectives into a final report</p>
          </div>
          <button
            onClick={() => { setActivePerspective('synthesis'); handleGenerate('synthesis'); }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Sparkles size={14} /> Synthesize
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="p-4 bg-zinc-900/30 rounded-2xl flex flex-col gap-2">
      <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">{icon}{title}</div>
      <div className="text-2xl font-light text-zinc-100">{value}</div>
    </div>
  );
}
