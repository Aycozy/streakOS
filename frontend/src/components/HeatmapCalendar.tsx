import React, { useMemo } from 'react';

interface HeatmapCalendarProps {
  logs: any[];
}

export default function HeatmapCalendar({ logs }: HeatmapCalendarProps) {
  const cells = useMemo(() => {
    const today = new Date();
    const result: { date: Date; count: number; label: string }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const count = logs.filter((log: any) => {
        return log.completed_at?.startsWith(dateStr);
      }).length;

      result.push({
        date: d,
        count,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return result;
  }, [logs]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-indigo-500/40';
    if (count === 2) return 'bg-indigo-500/65';
    return 'bg-indigo-500';
  };

  // Split into weeks (rows of 7)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-medium uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Calendar Grid — each row is one week */}
      <div className="flex flex-col gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((cell, ci) => (
              <div
                key={ci}
                title={`${cell.label}: ${cell.count} completion${cell.count !== 1 ? 's' : ''}`}
                className={`h-8 rounded-md transition-all duration-300 cursor-default ${getColor(cell.count)} border border-white/5 hover:ring-1 hover:ring-indigo-400`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-xs text-gray-500">Less</span>
        {[0, 1, 2, 3].map(n => (
          <div key={n} className={`w-4 h-4 rounded-sm ${getColor(n)} border border-white/5`} />
        ))}
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  );
}
