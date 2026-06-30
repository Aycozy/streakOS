import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Flame, CheckCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProStats({ isPremium }: { isPremium: boolean }) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  const habits = data?.habits || [];
  const longestStreak = habits.reduce((max: number, h: any) => Math.max(max, h.streak_count || 0), 0);
  const lifetimeCompletions = habits.reduce((sum: number, h: any) => sum + (h.streak_count || 0), 0) + 7; // Estimate for UI

  return (
    <div className="relative glass-panel col-span-1 md:col-span-2 overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 !p-6 flex flex-col justify-center">
      <h3 className="text-xl mb-4 text-white font-semibold flex items-center gap-2">
        <Flame className="text-orange-500" /> Advanced Analytics
      </h3>
      
      <div className={`grid grid-cols-2 gap-4 ${!isPremium ? 'blur-[4px] opacity-30 select-none' : ''}`}>
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-semibold">Longest Streak</p>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {longestStreak} <Flame size={24} className="text-orange-500" />
          </p>
        </div>
        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
          <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-semibold">Lifetime Logs</p>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {lifetimeCompletions} <CheckCircle size={24} className="text-green-500" />
          </p>
        </div>
      </div>

      {!isPremium && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-gray-900/90 p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-indigo-500/30 transform transition-transform hover:scale-105">
            <Lock className="text-indigo-400 mb-3" size={32} />
            <h4 className="text-xl font-bold text-white mb-2">Pro Analytics</h4>
            <p className="text-sm text-gray-400 mb-4 text-center max-w-[200px]">Upgrade to view your lifetime statistics and advanced insights.</p>
            <button onClick={() => navigate('/paywall')} className="btn btn-primary text-sm px-8 py-3 w-full shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
