import React, { useEffect, useRef, useState } from 'react';

interface CompletionRateBarProps {
  habit: { id: string; name: string; color: string };
  logs: any[];
  rank: number;
}

export default function CompletionRateBar({ habit, logs, rank }: CompletionRateBarProps) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  // Calculate completions over last 30 days
  const rate = (() => {
    const today = new Date();
    const thirty = new Date(today);
    thirty.setDate(today.getDate() - 29);
    const habitLogs = logs.filter((l: any) => {
      const d = new Date(l.completed_at);
      return l.habit_id === habit.id && d >= thirty;
    });
    return Math.round((habitLogs.length / 30) * 100);
  })();

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Animate in
      const t = setTimeout(() => setWidth(rate), 100 + rank * 80);
      return () => clearTimeout(t);
    }
  }, [rate, rank]);

  const medals = ['🥇', '🥈', '🥉'];
  const medal = rank < 3 ? medals[rank] : null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {medal && <span className="text-base">{medal}</span>}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: habit.color || '#6366f1' }}
          />
          <span className="text-sm font-medium text-white truncate max-w-[160px]">{habit.name}</span>
        </div>
        <span className="text-sm font-bold text-indigo-400 ml-2">{rate}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: habit.color || '#6366f1',
            boxShadow: `0 0 8px ${habit.color || '#6366f1'}80`,
          }}
        />
      </div>
    </div>
  );
}
