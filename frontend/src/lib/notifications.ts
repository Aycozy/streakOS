const STORAGE_KEY_ENABLED = 'streakos_reminders_enabled';
const STORAGE_KEY_TIME = 'streakos_reminders_time';

let reminderTimer: ReturnType<typeof setTimeout> | null = null;

export function getReminderPrefs(): { enabled: boolean; time: string } {
  return {
    enabled: localStorage.getItem(STORAGE_KEY_ENABLED) === 'true',
    time: localStorage.getItem(STORAGE_KEY_TIME) || '09:00',
  };
}

export function saveReminderPrefs(enabled: boolean, time: string) {
  localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
  localStorage.setItem(STORAGE_KEY_TIME, time);
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function cancelReminder() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
}

function fireNotification() {
  if (Notification.permission !== 'granted') return;
  new Notification('StreakOS 🔥', {
    body: "Time to build your streak! Don't break the chain today.",
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
}

export function scheduleReminder(time: string) {
  cancelReminder();

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If target has already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const msUntilFire = target.getTime() - now.getTime();

  reminderTimer = setTimeout(() => {
    fireNotification();
    // Re-schedule for next day
    scheduleReminder(time);
  }, msUntilFire);
}

export function initReminders() {
  const { enabled, time } = getReminderPrefs();
  if (enabled && Notification.permission === 'granted') {
    scheduleReminder(time);
  }
}
