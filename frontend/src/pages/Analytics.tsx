import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import {
  ArrowLeft, Lock, Flame, CalendarDays, BarChart3, Trophy, Zap,
} from 'lucide-react';
import HeatmapCalendar from '../components/HeatmapCalendar';
import CompletionRateBar from '../components/CompletionRateBar';
import Achievements from '../components/Achievements';

// ---------- Paywall Overlay ----------
function ProLock({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm bg-black/30 rounded-2xl">
      <div className="bg-gray-900/95 p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-indigo-500/30 max-w-[220px] text-center">
        <Lock className="text-indigo-400 mb-3" size={28} />
        <h4 className="text-base font-bold text-white mb-1">Pro Only</h4>
        <p className="text-xs text-gray-400 mb-4">Upgrade to unlock detailed analytics and insights.</p>
        <button onClick={onUpgrade} className="btn btn-primary text-sm px-6 py-2 w-full">
          Upgrade
        </button>
      </div>
    </div>
  );
}

// ---------- Section Wrapper ----------
function AnalyticsSection({
  title, icon: Icon, isPremium, onUpgrade, children,
}: {
  title: string;
  icon: React.ElementType;
  isPremium: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel relative overflow-hidden !p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon size={20} className="text-indigo-400" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {!isPremium && (
          <span className="ml-auto text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 tracking-wider uppercase">
            PRO
          </span>
        )}
      </div>
      <div className={!isPremium ? 'blur-[5px] select-none pointer-events-none' : ''}>
        {children}
      </div>
      {!isPremium && <ProLock onUpgrade={onUpgrade} />}
    </div>
  );
}

// ---------- Main Analytics Page ----------
export default function Analytics() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
  });

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  const { data: logsData } = useQuery({
    queryKey: ['logs'],
    queryFn: api.getAllLogs,
  });

  const isPremium = profile?.is_premium || false;
  const habits: any[] = habitsData?.habits || [];
  const logs: any[] = logsData?.logs || [];

  // ---- Derived Stats ----
  const stats = useMemo(() => {
    const today = new Date();
    const thirtyAgo = new Date(today);
    thirtyAgo.setDate(today.getDate() - 29);

    const thisMonthLogs = logs.filter(l => new Date(l.completed_at) >= thirtyAgo);

    // Most consistent habit (most logs this month)
    const habitLogCounts: Record<string, number> = {};
    thisMonthLogs.forEach((l: any) => {
      habitLogCounts[l.habit_id] = (habitLogCounts[l.habit_id] || 0) + 1;
    });
    const topHabitId = Object.entries(habitLogCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topHabit = habits.find(h => h.id === topHabitId);

    // This week's hot habit
    const sevenAgo = new Date(today);
    sevenAgo.setDate(today.getDate() - 6);
    const weekLogs = logs.filter(l => new Date(l.completed_at) >= sevenAgo);
    const weekCounts: Record<string, number> = {};
    weekLogs.forEach((l: any) => {
      weekCounts[l.habit_id] = (weekCounts[l.habit_id] || 0) + 1;
    });
    const hotHabitId = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const hotHabit = habits.find(h => h.id === hotHabitId);

    return {
      totalThisMonth: thisMonthLogs.length,
      topHabit,
      hotHabit,
    };
  }, [logs, habits]);

  // Habits sorted by streak for leaderboard
  const habitsByStreak = useMemo(() => {
    return [...habits].sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0));
  }, [habits]);

  // Habits sorted by completion rate for rate bars
  const habitsByRate = useMemo(() => {
    const today = new Date();
    const thirtyAgo = new Date(today);
    thirtyAgo.setDate(today.getDate() - 29);
    return [...habits].sort((a, b) => {
      const aCount = logs.filter(l => l.habit_id === a.id && new Date(l.completed_at) >= thirtyAgo).length;
      const bCount = logs.filter(l => l.habit_id === b.id && new Date(l.completed_at) >= thirtyAgo).length;
      return bCount - aCount;
    });
  }, [habits, logs]);

  return (
    <div className="container min-h-screen py-8">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary !p-2"
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl gradient-text mb-1">Analytics</h1>
          <p className="text-gray-400">Your habit performance, visualised.</p>
        </div>
        {isPremium && (
          <span className="ml-auto text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full shadow-lg">
            ✦ PRO
          </span>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'This Month', value: stats.totalThisMonth, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Habits Tracked', value: habits.length, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Best Streak', value: `${habitsByStreak[0]?.streak_count || 0}d`, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Top Habit', value: stats.topHabit?.name || '—', icon: Zap, color: 'text-green-400', bg: 'bg-green-400/10', small: true },
        ].map(({ label, value, icon: Icon, color, bg, small }) => (
          <div key={label} className="glass-panel !p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
              <p className={`font-bold text-white ${small ? 'text-sm truncate' : 'text-xl'}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Heatmap */}
        <div className="lg:col-span-2">
          <AnalyticsSection title="30-Day Activity" icon={CalendarDays} isPremium={isPremium} onUpgrade={() => navigate('/paywall')}>
            <HeatmapCalendar logs={logs} />
          </AnalyticsSection>
        </div>

        {/* Completion Rates */}
        <AnalyticsSection title="Completion Rates (30 days)" icon={BarChart3} isPremium={isPremium} onUpgrade={() => navigate('/paywall')}>
          {habitsByRate.length === 0 ? (
            <p className="text-gray-400 text-sm">No habits yet.</p>
          ) : (
            habitsByRate.map((h, i) => (
              <CompletionRateBar key={h.id} habit={h} logs={logs} rank={i} />
            ))
          )}
        </AnalyticsSection>

        {/* Streak Leaderboard */}
        <AnalyticsSection title="Streak Leaderboard" icon={Trophy} isPremium={isPremium} onUpgrade={() => navigate('/paywall')}>
          {habitsByStreak.length === 0 ? (
            <p className="text-gray-400 text-sm">No habits yet.</p>
          ) : (
            <div className="space-y-3">
              {habitsByStreak.map((h, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-xl w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: h.color || '#6366f1' }}
                    />
                    <span className="flex-1 text-sm font-medium text-white truncate">{h.name}</span>
                    <div className="flex items-center gap-1 text-orange-400 font-bold">
                      <Flame size={14} />
                      <span className="text-sm">{h.streak_count || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnalyticsSection>
      </div>

      {/* Achievements — free for everyone */}
      <div className="mt-6 glass-panel !p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Achievements</h2>
          <span className="ml-auto text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 tracking-wider uppercase">Free</span>
        </div>
        <Achievements habits={habits} logs={logs} />
      </div>
    </div>
  );
}
