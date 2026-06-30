import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Crown, Bell, BellOff } from 'lucide-react';
import {
  getReminderPrefs,
  saveReminderPrefs,
  requestPermission,
  scheduleReminder,
  cancelReminder,
} from '../lib/notifications';

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Reminder state
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...user, ...data });
      setLoading(false);
    }
    loadProfile();

    // Load notification prefs
    const prefs = getReminderPrefs();
    setRemindersEnabled(prefs.enabled);
    setReminderTime(prefs.time);
    if (!('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleToggleReminders = async () => {
    if (!remindersEnabled) {
      // Turning ON
      const granted = await requestPermission();
      if (!granted) {
        setNotifPermission('denied');
        return;
      }
      setNotifPermission('granted');
      saveReminderPrefs(true, reminderTime);
      scheduleReminder(reminderTime);
      setRemindersEnabled(true);
    } else {
      // Turning OFF
      saveReminderPrefs(false, reminderTime);
      cancelReminder();
      setRemindersEnabled(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    if (remindersEnabled) {
      saveReminderPrefs(true, newTime);
      scheduleReminder(newTime);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container min-h-screen py-8">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="btn btn-secondary !p-2" title="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
      </header>

      {loading ? (
        <div className="text-gray-400 text-center">Loading profile...</div>
      ) : (
        <div className="max-w-xl mx-auto flex flex-col gap-6 animate-fade-in">
          {/* Profile Card */}
          <div className="glass-panel flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{profile?.email}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile?.is_premium ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-gray-500/20 text-gray-400 border border-white/10'}`}>
                {profile?.is_premium ? '✦ PRO MEMBER' : 'FREE PLAN'}
              </span>
            </div>
          </div>

          {/* Subscription */}
          <div className="glass-panel">
            <h3 className="text-base font-bold mb-4 text-white">Subscription</h3>
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h4 className="font-semibold text-white mb-0.5">StreakOS Pro</h4>
                <p className="text-sm text-gray-400">Unlock advanced analytics & more habits.</p>
              </div>
              {profile?.is_premium ? (
                <span className="text-green-400 text-sm font-bold">✓ Active</span>
              ) : (
                <button onClick={() => navigate('/paywall')} className="btn btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
                  <Crown size={14} /> Upgrade
                </button>
              )}
            </div>
          </div>

          {/* Daily Reminders */}
          <div className="glass-panel">
            <h3 className="text-base font-bold mb-1 text-white flex items-center gap-2">
              <Bell size={18} className="text-indigo-400" /> Daily Reminders
            </h3>
            <p className="text-sm text-gray-400 mb-5">Get a browser notification to complete your habits.</p>

            {notifPermission === 'unsupported' && (
              <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                ⚠️ Your browser doesn't support notifications.
              </div>
            )}
            {notifPermission === 'denied' && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                🚫 Notification permission was denied. Please enable it in your browser settings.
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <div className="flex items-center gap-3">
                {remindersEnabled ? <Bell size={18} className="text-indigo-400" /> : <BellOff size={18} className="text-gray-500" />}
                <div>
                  <p className="text-sm font-semibold text-white">Enable Reminders</p>
                  <p className="text-xs text-gray-400">{remindersEnabled ? 'Reminders are active' : 'Click to enable'}</p>
                </div>
              </div>
              {/* Toggle Switch */}
              <button
                onClick={handleToggleReminders}
                disabled={notifPermission === 'unsupported'}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${remindersEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${remindersEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {remindersEnabled && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">Reminder Time</p>
                  <p className="text-xs text-gray-400">Daily at this time</p>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={handleTimeChange}
                  className="input-field !w-auto !py-1 !px-3 text-sm text-white"
                />
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="btn btn-secondary w-full"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
