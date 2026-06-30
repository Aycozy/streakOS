import React, { useMemo } from 'react';

interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
  check: (data: BadgeData) => { unlocked: boolean; progress?: string };
}

interface BadgeData {
  habits: any[];
  logs: any[];
}

const BADGES: Badge[] = [
  {
    id: 'first_step',
    emoji: '🌱',
    title: 'First Step',
    description: 'Complete your very first habit',
    color: '#10b981',
    check: ({ logs }) => ({ unlocked: logs.length >= 1 }),
  },
  {
    id: 'on_a_roll',
    emoji: '🔥',
    title: 'On a Roll',
    description: 'Achieve a 3-day streak on any habit',
    color: '#f97316',
    check: ({ habits }) => {
      const best = Math.max(0, ...habits.map(h => h.streak_count || 0));
      return { unlocked: best >= 3, progress: `${Math.min(best, 3)}/3 days` };
    },
  },
  {
    id: 'week_warrior',
    emoji: '⚔️',
    title: 'Week Warrior',
    description: '7-day streak on any habit',
    color: '#6366f1',
    check: ({ habits }) => {
      const best = Math.max(0, ...habits.map(h => h.streak_count || 0));
      return { unlocked: best >= 7, progress: `${Math.min(best, 7)}/7 days` };
    },
  },
  {
    id: 'monthly_master',
    emoji: '👑',
    title: 'Monthly Master',
    description: '30-day streak on any habit',
    color: '#f59e0b',
    check: ({ habits }) => {
      const best = Math.max(0, ...habits.map(h => h.streak_count || 0));
      return { unlocked: best >= 30, progress: `${Math.min(best, 30)}/30 days` };
    },
  },
  {
    id: 'habit_builder',
    emoji: '🏗️',
    title: 'Habit Builder',
    description: 'Create 3 habits',
    color: '#8b5cf6',
    check: ({ habits }) => ({
      unlocked: habits.length >= 3,
      progress: `${Math.min(habits.length, 3)}/3 habits`,
    }),
  },
  {
    id: 'overachiever',
    emoji: '⚡',
    title: 'Overachiever',
    description: 'Complete all your habits on the same day',
    color: '#eab308',
    check: ({ habits, logs }) => {
      if (habits.length === 0) return { unlocked: false };
      // Group logs by date
      const byDate: Record<string, Set<string>> = {};
      logs.forEach((l: any) => {
        const date = l.completed_at?.split('T')[0] || '';
        if (!byDate[date]) byDate[date] = new Set();
        byDate[date].add(l.habit_id);
      });
      const habitIds = new Set(habits.map((h: any) => h.id));
      const perfectDay = Object.values(byDate).some(
        daySet => habits.every((h: any) => daySet.has(h.id)) && daySet.size >= habitIds.size
      );
      return { unlocked: perfectDay };
    },
  },
  {
    id: 'centurion',
    emoji: '💯',
    title: 'Centurion',
    description: 'Log 100 total completions',
    color: '#ec4899',
    check: ({ logs }) => ({
      unlocked: logs.length >= 100,
      progress: `${Math.min(logs.length, 100)}/100`,
    }),
  },
  {
    id: 'dedicated',
    emoji: '🎯',
    title: 'Dedicated',
    description: 'Log 10 total completions',
    color: '#14b8a6',
    check: ({ logs }) => ({
      unlocked: logs.length >= 10,
      progress: `${Math.min(logs.length, 10)}/10`,
    }),
  },
];

interface AchievementsProps {
  habits: any[];
  logs: any[];
}

export default function Achievements({ habits, logs }: AchievementsProps) {
  const results = useMemo(() => {
    return BADGES.map(badge => ({
      ...badge,
      result: badge.check({ habits, logs }),
    }));
  }, [habits, logs]);

  const unlockedCount = results.filter(r => r.result.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">
          <span className="text-white font-bold">{unlockedCount}</span> of {BADGES.length} badges earned
        </p>
        <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {results.map(({ id, emoji, title, description, color, result }) => (
          <div
            key={id}
            className={`relative rounded-2xl p-4 border text-center transition-all duration-300 ${
              result.unlocked
                ? 'border-white/20 bg-white/5 shadow-lg'
                : 'border-white/5 bg-white/[0.02] opacity-50'
            }`}
            style={result.unlocked ? { boxShadow: `0 0 20px ${color}30` } : {}}
          >
            {result.unlocked && (
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
              />
            )}
            <div
              className="text-3xl mb-2 transition-transform"
              style={result.unlocked ? {} : { filter: 'grayscale(1)' }}
            >
              {emoji}
            </div>
            <h4 className="text-xs font-bold text-white mb-1 leading-tight">{title}</h4>
            <p className="text-[10px] text-gray-500 leading-tight mb-2">{description}</p>
            {!result.unlocked && result.result.progress && (
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {result.result.progress}
              </span>
            )}
            {result.unlocked && (
              <span className="text-[10px] font-bold text-green-400">✓ Unlocked</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
