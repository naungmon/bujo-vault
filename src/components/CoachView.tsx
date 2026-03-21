import React, { useEffect, useState } from 'react';

interface CoachData {
  period: string; streak: number; momentum: string; completionRate: number;
  priorityAlignment: number; totalEntries: number;
  stuckTasks: Array<{ text: string; count: number }>;
  killThemes: Record<string, number>;
  eventDensity: Record<string, { days: number; completionRate: number }>;
  noteHeavyDays: string[]; nudge: string; empty: boolean;
  productiveTime: string; tasksPerDayAvg: number;
}

interface CoachViewProps {
  onClose: () => void;
}

export function CoachView({ onClose }: CoachViewProps) {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.bujo) {
      window.bujo.analyticsCoach().then(d => {
        setData(d);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Analyzing...</p>
    </div>
  );

  if (!data) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Failed to load analytics.</p>
    </div>
  );

  if (data.empty) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <p className="text-2xl font-serif text-zinc-300 mb-4">
          {data.totalEntries === 0 ? "Nothing captured yet today." :
           data.totalEntries === 1 ? "One entry. Keep going." :
           `${data.totalEntries} entries. You're warming up.`}
        </p>
        <p className="text-sm text-zinc-500">
          {data.streak >= 3 ? `${data.streak} day streak. Don't break it.` :
           data.streak === 0 ? "Start your streak today." :
           "Capture 5+ entries to unlock coaching."}
        </p>
      </div>
    </div>
  );

  const momentumColor = {
    building: 'bg-emerald-500/20 text-emerald-400',
    steady: 'bg-blue-500/20 text-blue-400',
    stalling: 'bg-amber-500/20 text-amber-400',
    stalled: 'bg-red-500/20 text-red-400',
    new: 'bg-zinc-500/20 text-zinc-400',
  }[data.momentum] || 'bg-zinc-500/20 text-zinc-400';

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">

          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${momentumColor}`}>{data.momentum}</span>
            <span className="text-zinc-500 text-sm">{Math.round(data.completionRate * 100)}% completion</span>
            <span className="text-zinc-500 text-sm">{Math.round(data.priorityAlignment * 100)}% priority aligned</span>
            {data.streak >= 3 && <span className="text-zinc-500 text-sm">{data.streak} day streak</span>}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="completion" value={`${Math.round(data.completionRate * 100)}%`} />
            <MetricCard label="priority aligned" value={`${Math.round(data.priorityAlignment * 100)}%`} />
            <MetricCard label="tasks/day" value={data.tasksPerDayAvg.toString()} />
            <MetricCard label="productive" value={data.productiveTime.split(' ')[0]} />
          </div>

          {data.stuckTasks.length > 0 && (
            <Section title="Stuck tasks (migrated 3+ times)">
              {data.stuckTasks.map((t, i) => (
                <div key={i} className="text-sm text-amber-400 flex items-center gap-2">
                  <span className="text-amber-600">&gt;</span>
                  {t.text}
                  <span className="text-zinc-600 text-xs">({t.count}x)</span>
                </div>
              ))}
            </Section>
          )}

          {Object.keys(data.killThemes).length > 0 && (
            <Section title="Kill patterns">
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.killThemes).slice(0, 5).map(([theme, count]) => (
                  <span key={theme} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                    {theme} ({count})
                  </span>
                ))}
              </div>
            </Section>
          )}

          {data.eventDensity && (
            <Section title="Event density impact">
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((bucket) => {
                  const d = data.eventDensity[bucket];
                  return (
                    <div key={bucket} className="text-sm">
                      <span className="text-zinc-500 capitalize">{bucket}:</span>{' '}
                      <span className="text-zinc-300">{Math.round(d.completionRate * 100)}%</span>
                      <span className="text-zinc-600 text-xs"> ({d.days}d)</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {data.noteHeavyDays.length > 0 && (
            <Section title="Note-heavy days">
              <p className="text-sm text-zinc-400">
                {data.noteHeavyDays.join(', ')} — dumps, not daily rhythm.
              </p>
            </Section>
          )}

          <div className="border-t border-zinc-800 pt-6">
            <p className="text-lg font-serif text-zinc-200">{data.nudge}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900/30 rounded-xl p-4">
      <div className="text-2xl font-light text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
