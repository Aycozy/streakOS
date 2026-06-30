import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: api.getAllLogs,
  });

  const chartData = useMemo(() => {
    if (!data?.logs) return [];
    
    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    
    // Current date logic to get the last 7 days aligned
    const today = new Date();
    const todayIndex = today.getDay();

    data.logs.forEach((log: any) => {
      const logDate = new Date(log.completed_at);
      const dayIndex = logDate.getDay();
      counts[dayIndex] += 1;
    });

    // Reorder so today is last
    const orderedData = [];
    for (let i = 6; i >= 0; i--) {
      let index = todayIndex - i;
      if (index < 0) index += 7;
      orderedData.push({
        day: days[index],
        completions: counts[index]
      });
    }

    return orderedData;
  }, [data]);

  if (isLoading) return <div className="text-gray-400">Loading chart...</div>;

  return (
    <div className="glass-panel w-full h-64 mb-8">
      <h3 className="text-lg font-bold mb-4">Weekly Completions</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData}>
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="completions" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
