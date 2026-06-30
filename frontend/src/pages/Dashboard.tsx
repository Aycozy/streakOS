import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Plus, LogOut, CheckCircle, Flame, Settings as SettingsIcon, Trash2, BarChart3 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WeeklyChart from '../components/WeeklyChart';
import ProStats from '../components/ProStats';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Immediate Session Verification
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      api.verifySession(sessionId).then((res: any) => {
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          searchParams.delete('session_id');
          setSearchParams(searchParams, { replace: true });
        }
      }).catch(console.error);
    }
  }, [searchParams, setSearchParams, queryClient]);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#6366f1');

  const { data, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  const createHabitMutation = useMutation({
    mutationFn: api.createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowAdd(false);
      setNewHabitName('');
    },
    onError: (err: any) => {
      if (err.message === 'FREE_LIMIT_REACHED') {
        navigate('/paywall');
      } else {
        alert(`Failed to create habit: ${err.message}`);
      }
    }
  });

  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    createHabitMutation.mutate({ name: newHabitName, frequency: 'Daily', color: newHabitColor });
  };

  const logHabitMutation = useMutation({
    mutationFn: api.logHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleLogHabit = (id: string) => {
    if (completedToday.has(id)) return;
    setCompletedToday(prev => new Set(prev).add(id));
    logHabitMutation.mutate(id);
  };

  const deleteHabitMutation = useMutation({
    mutationFn: api.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const handleDeleteHabit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabitMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container min-h-screen py-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl gradient-text mb-1">Your Dashboard</h1>
          <p className="text-gray-400">Track your daily progress.</p>
        </div>
        <div className="flex gap-2 desktop-nav-only">
          <button onClick={() => navigate('/analytics')} className="btn btn-secondary !p-2" title="Analytics">
            <BarChart3 size={20} />
          </button>
          <button onClick={() => navigate('/settings')} className="btn btn-secondary !p-2" title="Settings">
            <SettingsIcon size={20} />
          </button>
          <button onClick={handleLogout} className="btn btn-secondary !p-2" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel col-span-1 flex flex-col justify-center items-start bg-indigo-500/10 !p-6">
          <div className="mb-4">
            <h3 className="text-xl mb-1 text-white font-semibold">Today's Focus</h3>
            <p className="text-sm text-gray-400">Keep your streaks alive!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame size={24} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedToday.size}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Completed</p>
            </div>
          </div>
        </div>
        
        <ProStats isPremium={profile?.is_premium || false} />
      </div>

      <WeeklyChart />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Habits</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary !p-2 rounded-full">
          <Plus size={24} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreateHabit} className="glass-panel mb-6 animate-fade-in">
          <input
            type="text"
            className="input mb-4"
            placeholder="e.g. Read 10 pages"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            autoFocus
          />
          
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block flex items-center justify-between">
              Habit Color
              {!profile?.is_premium && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">PRO</span>}
            </label>
            <div className="flex gap-2">
              {['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'].map(color => (
                <button
                  key={color}
                  type="button"
                  disabled={!profile?.is_premium && color !== '#6366f1'}
                  onClick={() => setNewHabitColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${newHabitColor === color ? 'border-white' : 'border-transparent'} ${!profile?.is_premium && color !== '#6366f1' ? 'opacity-20 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {!profile?.is_premium && (
              <p className="text-xs text-gray-500 mt-2 cursor-pointer hover:text-indigo-400" onClick={() => navigate('/paywall')}>
                Unlock custom colors with StreakOS Pro
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="submit" className="btn btn-primary" disabled={createHabitMutation.isPending}>
              {createHabitMutation.isPending ? 'Saving...' : 'Add Habit'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading habits...</div>
      ) : (
        <div className="grid gap-4">
          {data?.habits?.length === 0 ? (
            <div className="text-center py-12 text-gray-400 glass-panel">
              No habits yet. Click the + button to create one!
            </div>
          ) : (
            data?.habits?.map((habit: any) => {
              const isCompleted = completedToday.has(habit.id);
              return (
                <div key={habit.id} className="glass-panel p-4 mb-3 flex items-center justify-between group animate-fade-in transition-all hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLogHabit(habit.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-500 hover:border-white'}`}
                      disabled={isCompleted || logHabitMutation.isPending}
                    >
                      {isCompleted && <CheckCircle size={20} className="text-white" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color || '#6366f1' }}></div>
                        {habit.name}
                      </h3>
                      <p className="text-sm text-gray-400">{habit.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-orange-400 font-medium bg-orange-400/10 px-3 py-1 rounded-full">
                      <Flame size={16} /> {habit.streak_count || 0}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteHabit(e, habit.id)}
                      className="text-gray-500 hover:text-danger transition-colors !p-1"
                      title="Delete habit"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
