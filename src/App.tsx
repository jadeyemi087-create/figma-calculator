import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, DragEvent, FormEvent, ReactNode } from 'react';

type Category = 'work' | 'study' | 'wellness' | 'personal' | 'errands' | 'meals';
type RepeatRule = 'none' | 'daily' | 'weekly' | 'custom';
type AppView = 'day' | 'week' | 'routines';
type NotificationState = NotificationPermission | 'unsupported';

type DaybookTask = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  duration: number;
  category: Category;
  repeat: RepeatRule;
  days: number[];
  reminderMinutes: number | null;
  completedOn: string[];
  snoozedUntil?: Record<string, number>;
};

type TaskForm = {
  title: string;
  date: string;
  time: string;
  duration: string;
  category: Category;
  reminderMinutes: string;
  repeat: RepeatRule;
  days: number[];
};

type IconName =
  | 'sun'
  | 'calendar'
  | 'calendarDays'
  | 'repeat'
  | 'check'
  | 'bell'
  | 'chevronLeft'
  | 'chevronRight'
  | 'plus'
  | 'clock'
  | 'briefcase'
  | 'book'
  | 'leaf'
  | 'heart'
  | 'bag'
  | 'coffee'
  | 'grip'
  | 'more'
  | 'close'
  | 'sparkle'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'move'
  | 'circleCheck';

const STORAGE_KEY = 'daybook.local.tasks.v1';
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CATEGORIES: { value: Category; label: string; icon: IconName }[] = [
  { value: 'work', label: 'Work', icon: 'briefcase' },
  { value: 'study', label: 'Study', icon: 'book' },
  { value: 'wellness', label: 'Wellness', icon: 'leaf' },
  { value: 'personal', label: 'Personal', icon: 'heart' },
  { value: 'errands', label: 'Errands', icon: 'bag' },
  { value: 'meals', label: 'Meals', icon: 'coffee' },
];

function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  let artwork: ReactNode;
  switch (name) {
    case 'sun':
      artwork = <><circle cx="12" cy="12" r="3.6" /><path d="M12 2.5v2M12 19.5v2M4.78 4.78l1.42 1.42m11.6 11.6 1.42 1.42M2.5 12h2m15 0h2M4.78 19.22l1.42-1.42m11.6-11.6 1.42-1.42" /></>;
      break;
    case 'calendar':
      artwork = <><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" /></>;
      break;
    case 'calendarDays':
      artwork = <><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 16.5h.01M12 16.5h.01M16.5 16.5h.01" /></>;
      break;
    case 'repeat':
      artwork = <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>;
      break;
    case 'check':
      artwork = <path d="m5 12.5 4.3 4.3L19.5 6.8" />;
      break;
    case 'bell':
      artwork = <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>;
      break;
    case 'chevronLeft':
      artwork = <path d="m14.5 18-6-6 6-6" />;
      break;
    case 'chevronRight':
      artwork = <path d="m9.5 18 6-6-6-6" />;
      break;
    case 'plus':
      artwork = <path d="M12 5v14M5 12h14" />;
      break;
    case 'clock':
      artwork = <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.4 2" /></>;
      break;
    case 'briefcase':
      artwork = <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18M10 12v2h4v-2" /></>;
      break;
    case 'book':
      artwork = <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7M8 10.5h7" /></>;
      break;
    case 'leaf':
      artwork = <><path d="M20.5 3.5C11 3.5 5 6.4 5 12.5A5.5 5.5 0 0 0 10.5 18c6.1 0 9-6 10-14.5Z" /><path d="M3.5 21c2.8-5.3 6.3-8.8 11-11" /></>;
      break;
    case 'heart':
      artwork = <path d="M20.5 8.7c0 4.4-8.5 10.3-8.5 10.3S3.5 13.1 3.5 8.7a4.4 4.4 0 0 1 8.5-1.5 4.4 4.4 0 0 1 8.5 1.5Z" />;
      break;
    case 'bag':
      artwork = <><path d="M5 8h14l1.2 12H3.8L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2M9 12v1M15 12v1" /></>;
      break;
    case 'coffee':
      artwork = <><path d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M7 4v2M11 4v2M15 4v2" /></>;
      break;
    case 'grip':
      artwork = <><circle cx="8" cy="6" r=".8" fill="currentColor" stroke="none" /><circle cx="16" cy="6" r=".8" fill="currentColor" stroke="none" /><circle cx="8" cy="12" r=".8" fill="currentColor" stroke="none" /><circle cx="16" cy="12" r=".8" fill="currentColor" stroke="none" /><circle cx="8" cy="18" r=".8" fill="currentColor" stroke="none" /><circle cx="16" cy="18" r=".8" fill="currentColor" stroke="none" /></>;
      break;
    case 'more':
      artwork = <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>;
      break;
    case 'close':
      artwork = <path d="m6 6 12 12M18 6 6 18" />;
      break;
    case 'sparkle':
      artwork = <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>;
      break;
    case 'arrowRight':
      artwork = <><path d="M4 12h15M13 6l6 6-6 6" /></>;
      break;
    case 'arrowUpRight':
      artwork = <><path d="M7 17 17 7M7 7h10v10" /></>;
      break;
    case 'move':
      artwork = <><path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" /></>;
      break;
    case 'circleCheck':
      artwork = <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 9" /></>;
      break;
    default:
      artwork = null;
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...common}
    >
      {artwork}
    </svg>
  );
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function shiftDate(value: string, amount: number) {
  const result = dateFromKey(value);
  result.setDate(result.getDate() + amount);
  return dateKey(result);
}

function weekdayFor(value: string) {
  return dateFromKey(value).getDay();
}

function weekFor(value: string) {
  const result = dateFromKey(value);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  return dateKey(result);
}

function getWeek(value: string) {
  const start = weekFor(value);
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(dateFromKey(value));
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateFromKey(value));
}

function formatWeekRange(start: string) {
  const end = shiftDate(start, 6);
  const startDate = dateFromKey(start);
  const endDate = dateFromKey(end);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(endDate);
  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate);
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(endDate);
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${year}`;
  }
  return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${year}`;
}

function formatClock(time: string | null) {
  if (!time) return 'Anytime';
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!remaining) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remaining} min`;
}

function appointmentDate(value: string, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const result = dateFromKey(value);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function dateIsToday(value: string, today: string) {
  return value === today;
}

function createDemoTasks(today: string): DaybookTask[] {
  const complete = [today];
  return [
    {
      id: 'demo-vitamins', title: 'Take your vitamins', date: today, time: '08:00', duration: 5,
      category: 'wellness', repeat: 'daily', days: [], reminderMinutes: null, completedOn: complete,
    },
    {
      id: 'demo-stretch', title: 'A slow start & a stretch', date: today, time: '08:15', duration: 15,
      category: 'wellness', repeat: 'none', days: [], reminderMinutes: null, completedOn: complete,
    },
    {
      id: 'demo-biology', title: 'Review biology notes', date: today, time: '09:00', duration: 45,
      category: 'study', repeat: 'none', days: [], reminderMinutes: null, completedOn: complete,
    },
    {
      id: 'demo-email', title: 'Send Olivia the draft', date: today, time: '10:30', duration: 25,
      category: 'work', repeat: 'none', days: [], reminderMinutes: null, completedOn: complete,
    },
    {
      id: 'demo-lunch', title: 'Lunch away from your desk', date: today, time: '12:00', duration: 45,
      category: 'meals', repeat: 'none', days: [], reminderMinutes: null, completedOn: complete,
    },
    {
      id: 'demo-lab', title: 'Focus on your lab report', date: today, time: '14:00', duration: 60,
      category: 'study', repeat: 'none', days: [], reminderMinutes: 10, completedOn: [],
    },
    {
      id: 'demo-pharmacy', title: 'Pick up your prescription', date: today, time: '15:30', duration: 20,
      category: 'errands', repeat: 'none', days: [], reminderMinutes: 15, completedOn: [],
    },
    {
      id: 'demo-walk', title: 'An evening walk', date: today, time: '18:00', duration: 30,
      category: 'wellness', repeat: 'none', days: [], reminderMinutes: null, completedOn: [],
    },
  ];
}

function loadTasks() {
  const today = dateKey();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as DaybookTask[];
    }
  } catch {
    // If local storage is unavailable or has old data, start with a fresh local day.
  }
  return createDemoTasks(today);
}

function occursOn(task: DaybookTask, value: string) {
  if (value < task.date) return false;
  if (task.repeat === 'none') return task.date === value;
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'weekly') return weekdayFor(task.date) === weekdayFor(value);
  return task.days.includes(weekdayFor(value));
}

function isDoneOn(task: DaybookTask, value: string) {
  return task.completedOn?.includes(value) ?? false;
}

function notificationPermission(): NotificationState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

function categoryFor(category: Category) {
  return CATEGORIES.find((item) => item.value === category) ?? CATEGORIES[3];
}

function repeatText(task: DaybookTask) {
  if (task.repeat === 'daily') return 'Every day';
  if (task.repeat === 'weekly') return `Every ${WEEKDAY_NAMES[weekdayFor(task.date)]}`;
  if (task.repeat === 'custom') {
    const names = task.days.map((day) => WEEKDAY_NAMES[day]).join(', ');
    return names ? `Every ${names}` : 'Choose days';
  }
  return 'Doesn’t repeat';
}

function emptyForm(date: string, routine = false): TaskForm {
  return {
    title: '',
    date,
    time: '',
    duration: '30',
    category: 'personal',
    reminderMinutes: '',
    repeat: routine ? 'weekly' : 'none',
    days: routine ? [weekdayFor(date)] : [],
  };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function App() {
  const [today] = useState(() => dateKey());
  const [tasks, setTasks] = useState<DaybookTask[]>(loadTasks);
  const [view, setView] = useState<AppView>('day');
  const [selectedDate, setSelectedDate] = useState(today);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(() => emptyForm(today));
  const [toast, setToast] = useState('');
  const [permission, setPermission] = useState<NotificationState>(notificationPermission);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The planner remains usable in memory if this browser blocks local storage.
    }
  }, [tasks]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!composerOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setComposerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composerOpen]);

  useEffect(() => {
    if (permission !== 'granted') return undefined;
    const timers: number[] = [];
    const now = Date.now();
    const dates = Array.from({ length: 8 }, (_, index) => shiftDate(today, index));
    for (const day of dates) {
      for (const task of tasks) {
        if (!task.time || task.reminderMinutes === null || !occursOn(task, day) || isDoneOn(task, day)) continue;
        const baseTime = appointmentDate(day, task.time).getTime() - task.reminderMinutes * 60_000;
        const snoozed = task.snoozedUntil?.[day];
        const scheduledTime = snoozed && snoozed > now ? snoozed : baseTime;
        const delay = scheduledTime - now;
        if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) continue;
        const timer = window.setTimeout(() => {
          try {
            new window.Notification(task.title, {
              body: `Coming up at ${formatClock(task.time)} · ${formatDuration(task.duration)}`,
              icon: '/daybook-icon.svg',
            });
          } catch {
            // Permission can be revoked while this page is open.
          }
        }, delay);
        timers.push(timer);
      }
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [permission, tasks, today]);

  const weekDays = useMemo(() => getWeek(selectedDate), [selectedDate]);
  const dayTasks = useMemo(
    () => tasks.filter((task) => occursOn(task, selectedDate)).sort((a, b) => {
      if (!a.time && !b.time) return a.title.localeCompare(b.title);
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    }),
    [tasks, selectedDate],
  );
  const completedCount = dayTasks.filter((task) => isDoneOn(task, selectedDate)).length;
  const remainingCount = dayTasks.length - completedCount;
  const progress = dayTasks.length ? Math.round((completedCount / dayTasks.length) * 100) : 0;
  const plannedMinutes = dayTasks.reduce((sum, task) => sum + task.duration, 0);
  const unfinishedOneOffs = tasks.filter(
    (task) => task.repeat === 'none' && task.date === selectedDate && !isDoneOn(task, selectedDate),
  );
  const routines = tasks.filter((task) => task.repeat !== 'none').sort((a, b) => {
    if (!a.time && !b.time) return a.title.localeCompare(b.title);
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
  const reminderTask = useMemo(() => {
    const pending = dayTasks.filter((task) => !isDoneOn(task, selectedDate) && task.time);
    if (!pending.length) return null;
    if (!dateIsToday(selectedDate, today)) return pending.find((task) => task.reminderMinutes !== null) ?? pending[0];
    const currentTime = new Date();
    return pending.find((task) => appointmentDate(selectedDate, task.time!).getTime() > currentTime.getTime() && task.reminderMinutes !== null)
      ?? pending.find((task) => appointmentDate(selectedDate, task.time!).getTime() > currentTime.getTime())
      ?? pending[0];
  }, [dayTasks, selectedDate, today]);

  function showToast(message: string) {
    setToast(message);
  }

  function openNewTask(routine = false) {
    setEditingId(null);
    setForm(emptyForm(selectedDate, routine));
    setComposerOpen(true);
  }

  function openEditor(task: DaybookTask) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      date: task.date,
      time: task.time ?? '',
      duration: String(task.duration),
      category: task.category,
      reminderMinutes: task.reminderMinutes === null ? '' : String(task.reminderMinutes),
      repeat: task.repeat,
      days: [...task.days],
    });
    setComposerOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    const taskDate = form.date || selectedDate;
    const rule = form.repeat;
    const taskDays = rule === 'weekly' ? [weekdayFor(taskDate)] : rule === 'custom' ? form.days : [];
    const updated: DaybookTask = {
      id: editingId ?? `task-${crypto.randomUUID()}`,
      title,
      date: taskDate,
      time: form.time || null,
      duration: Math.max(5, Number(form.duration) || 30),
      category: form.category,
      repeat: rule,
      days: taskDays,
      reminderMinutes: form.reminderMinutes === '' ? null : Number(form.reminderMinutes),
      completedOn: editingId ? tasks.find((task) => task.id === editingId)?.completedOn ?? [] : [],
      snoozedUntil: editingId ? tasks.find((task) => task.id === editingId)?.snoozedUntil : undefined,
    };

    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? updated : task));
      showToast('Your changes are saved.');
    } else {
      setTasks((current) => [...current, updated]);
      showToast(rule === 'none' ? 'Added to your day.' : 'Your routine is ready.');
    }
    setComposerOpen(false);
  }

  function toggleComplete(task: DaybookTask, value = selectedDate) {
    setTasks((current) => current.map((item) => {
      if (item.id !== task.id) return item;
      const completedOn = item.completedOn ?? [];
      const next = isDoneOn(item, value)
        ? completedOn.filter((date) => date !== value)
        : [...completedOn, value];
      return { ...item, completedOn: next };
    }));
  }

  function snoozeReminder(task: DaybookTask) {
    const snoozeUntil = Date.now() + 10 * 60_000;
    setTasks((current) => current.map((item) => item.id === task.id
      ? { ...item, snoozedUntil: { ...item.snoozedUntil, [selectedDate]: snoozeUntil } }
      : item));
    showToast('Reminder snoozed for 10 minutes.');
  }

  async function turnOnNotifications() {
    if (!('Notification' in window)) {
      showToast('Browser notifications aren’t available on this device.');
      return;
    }
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
      showToast(result === 'granted' ? 'Reminders are on for this device.' : 'You can turn reminders on in browser settings.');
    } catch {
      showToast('We couldn’t turn on reminders just now.');
    }
  }

  function moveUnfinishedToTomorrow() {
    const count = unfinishedOneOffs.length;
    if (!count) return;
    const tomorrow = shiftDate(selectedDate, 1);
    setTasks((current) => current.map((task) => {
      if (task.repeat !== 'none' || task.date !== selectedDate || isDoneOn(task, selectedDate)) return task;
      return { ...task, date: tomorrow };
    }));
    showToast(`${count} unfinished ${count === 1 ? 'task' : 'tasks'} moved to ${compactDate(tomorrow)}.`);
  }

  function rescheduleOnDrop(target: DaybookTask, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/daybook-task') || draggingId;
    if (!sourceId || sourceId === target.id) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }
    const source = tasks.find((task) => task.id === sourceId);
    if (!source) return;
    const newTime = target.time;
    setTasks((current) => current.map((task) => task.id === sourceId ? { ...task, time: newTime } : task));
    showToast(newTime ? `Moved “${source.title}” to ${formatClock(newTime)}.` : `Moved “${source.title}” to anytime.`);
    setDraggingId(null);
    setDropTargetId(null);
  }

  function changeSelectedDate(amount: number) {
    setSelectedDate((current) => shiftDate(current, amount));
  }

  function renderTaskRow(task: DaybookTask, index: number) {
    const done = isDoneOn(task, selectedDate);
    const isOverdue = dateIsToday(selectedDate, today) && task.time !== null
      && appointmentDate(selectedDate, task.time).getTime() < Date.now() && !done;
    const category = categoryFor(task.category);
    const isDragging = draggingId === task.id;
    const isTarget = dropTargetId === task.id && draggingId !== task.id;

    return (
      <div className={`timeline-row ${index === 0 ? 'timeline-row-first' : ''}`} key={task.id}>
        <div className={`timeline-time ${isOverdue ? 'timeline-time-overdue' : ''}`}>
          {isOverdue && <span className="overdue-dot" aria-label="Overdue" />}
          <span>{task.time ? formatClock(task.time) : 'Anytime'}</span>
        </div>
        <div className={`timeline-marker ${done ? 'timeline-marker-done' : ''}`} aria-hidden="true">
          <span />
        </div>
        <div
          className={`task-card ${done ? 'task-card-done' : ''} ${isDragging ? 'task-card-dragging' : ''} ${isTarget ? 'task-card-drop-target' : ''}`}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/daybook-task', task.id);
            setDraggingId(task.id);
          }}
          onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            if (draggingId !== task.id) setDropTargetId(task.id);
          }}
          onDragLeave={() => setDropTargetId((current) => current === task.id ? null : current)}
          onDrop={(event) => rescheduleOnDrop(task, event)}
        >
          <button
            type="button"
            className={`task-check ${done ? 'task-check-done' : ''}`}
            aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
            aria-pressed={done}
            onClick={() => toggleComplete(task)}
          >
            {done && <Icon name="check" size={15} />}
          </button>
          <div className={`category-tile category-${task.category}`} aria-hidden="true">
            <Icon name={category.icon} size={18} />
          </div>
          <button className="task-card-copy" type="button" onClick={() => openEditor(task)} aria-label={`Edit ${task.title}`}>
            <span className="task-title">{task.title}</span>
            <span className="task-subline">
              <span>{category.label}</span>
              <span className="subline-separator">·</span>
              <span>{formatDuration(task.duration)}</span>
              {isOverdue && <><span className="subline-separator">·</span><span className="overdue-label">Needs a new time</span></>}
              {done && <><span className="subline-separator">·</span><span className="done-label">Done</span></>}
              {task.repeat !== 'none' && <><span className="subline-separator">·</span><span className="repeat-mini"><Icon name="repeat" size={12} /> Repeats</span></>}
            </span>
          </button>
          {task.reminderMinutes !== null && !done && <span className="task-reminder-hint" title="Reminder set"><Icon name="bell" size={14} /></span>}
          <button className="task-edit-button" type="button" onClick={() => openEditor(task)} aria-label={`Edit ${task.title}`}>
            <Icon name="grip" size={17} />
          </button>
        </div>
      </div>
    );
  }

  const navItems: { id: AppView; label: string; icon: IconName }[] = [
    { id: 'day', label: 'My day', icon: 'sun' },
    { id: 'week', label: 'My week', icon: 'calendarDays' },
    { id: 'routines', label: 'Routines', icon: 'repeat' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#day" onClick={(event) => { event.preventDefault(); setView('day'); }} aria-label="Daybook home">
          <span className="brand-mark"><Icon name="sun" size={22} /></span>
          <span className="brand-name">daybook<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-overline">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={`nav-link ${view === item.id ? 'nav-link-active' : ''}`}
              type="button"
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === 'routines' && routines.length > 0 && <span className="nav-count">{routines.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-week-card">
          <span className="week-card-icon"><Icon name="sparkle" size={17} /></span>
          <p className="sidebar-card-label">A gentle reminder</p>
          <p className="sidebar-card-copy">A good plan leaves room for real life.</p>
          <div className="sidebar-card-rule" />
          <span className="sidebar-week-detail"><Icon name="calendar" size={14} /> {formatWeekRange(weekFor(selectedDate))}</span>
        </div>

        <div className="sidebar-bottom">
          <button className="profile-button" type="button" onClick={() => showToast('Your plans stay right here on this device.') }>
            <span className="profile-avatar">JT</span>
            <span className="profile-copy"><strong>Jamie Taylor</strong><small>Personal space</small></span>
            <Icon name="more" size={18} />
          </button>
          <p className="local-note"><span className="local-note-dot" /> Saved on this device</p>
        </div>
      </aside>

      <main className="main-content">
        <div className="mobile-brand-row">
          <a className="brand-lockup" href="#day" onClick={(event) => { event.preventDefault(); setView('day'); }} aria-label="Daybook home">
            <span className="brand-mark"><Icon name="sun" size={20} /></span>
            <span className="brand-name">daybook<span className="brand-period">.</span></span>
          </a>
          <button className="mobile-bell" type="button" aria-label="Turn on reminders" onClick={turnOnNotifications}>
            <Icon name="bell" size={19} />
            {permission === 'granted' && <span className="bell-enabled-dot" />}
          </button>
        </div>

        <header className="page-header">
          <div className="page-heading">
            <p className="eyebrow">{longDate(selectedDate).toUpperCase()}</p>
            <h1>{greeting()}, Jamie<span className="greeting-sun"> ☀</span></h1>
            <p className="page-subtitle">Here’s a little space to make today yours.</p>
          </div>
          <div className="header-actions">
            <button className={`header-icon-button ${permission === 'granted' ? 'header-icon-enabled' : ''}`} type="button" onClick={turnOnNotifications} aria-label={permission === 'granted' ? 'Reminders are on' : 'Turn on reminders'} title={permission === 'granted' ? 'Reminders are on' : 'Turn on reminders'}>
              <Icon name="bell" size={19} />
              {permission === 'granted' && <span className="bell-enabled-dot" />}
            </button>
            <span className="header-avatar" aria-label="Jamie Taylor">JT</span>
          </div>
        </header>

        {view === 'day' && (
          <>
            <section className="date-strip-section" aria-label="Choose a day">
              <div className="date-strip" key={weekDays[0]}>
                <button className="date-strip-arrow" type="button" onClick={() => changeSelectedDate(-7)} aria-label="Previous week"><Icon name="chevronLeft" size={18} /></button>
                {weekDays.map((day) => {
                  const selected = day === selectedDate;
                  const todayFlag = day === today;
                  const dayTasksCount = tasks.filter((task) => occursOn(task, day)).length;
                  return (
                    <button
                      className={`date-chip ${selected ? 'date-chip-selected' : ''} ${todayFlag && !selected ? 'date-chip-today' : ''}`}
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      aria-pressed={selected}
                      aria-label={`${longDate(day)}${todayFlag ? ', today' : ''}${dayTasksCount ? `, ${dayTasksCount} tasks` : ''}`}
                    >
                      <span className="date-chip-day">{WEEKDAY_NAMES[weekdayFor(day)]}</span>
                      <span className="date-chip-number">{dateFromKey(day).getDate()}</span>
                      <span className="date-chip-indicator">{dayTasksCount > 0 && <i />}</span>
                    </button>
                  );
                })}
                <button className="date-strip-arrow" type="button" onClick={() => changeSelectedDate(7)} aria-label="Next week"><Icon name="chevronRight" size={18} /></button>
              </div>
              {selectedDate !== today && <button className="today-link" type="button" onClick={() => setSelectedDate(today)}>Back to today</button>}
            </section>

            <div className="content-columns">
              <section className="day-main-column">
                <div className="section-heading-row">
                  <div>
                    <div className="section-heading-with-count">
                      <h2>Your timeline</h2>
                      <span className="task-count-pill">{completedCount} of {dayTasks.length} done</span>
                    </div>
                    <p className="section-description">One thing at a time. You’ve got this.</p>
                  </div>
                  <button className="round-add-button" type="button" onClick={() => openNewTask()} aria-label="Add a task" title="Add a task">
                    <Icon name="plus" size={23} />
                  </button>
                </div>

                {dayTasks.length ? (
                  <div className="timeline-list" aria-label="Daily timeline">
                    {dayTasks.map((task, index) => renderTaskRow(task, index))}
                    <div className="timeline-endcap">
                      <span className="timeline-end-dot" />
                      <span>There’s room for the rest of your day</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-day-card">
                    <span className="empty-illustration"><Icon name="sun" size={25} /></span>
                    <h3>A little open space</h3>
                    <p>Your day is yours. Add a task whenever you’re ready.</p>
                    <button className="text-action" type="button" onClick={() => openNewTask()}>Add your first task <Icon name="arrowRight" size={16} /></button>
                  </div>
                )}

                {dayTasks.length > 0 && (
                  <button className="timeline-add-link" type="button" onClick={() => openNewTask()}>
                    <span><Icon name="plus" size={15} /></span> Add a little more to your day
                  </button>
                )}
              </section>

              <aside className="day-aside" aria-label="Day overview">
                <section className="overview-card">
                  <div className="aside-card-heading">
                    <span className="eyebrow">A LITTLE OVERVIEW</span>
                    <span className="overview-sparkle"><Icon name="sparkle" size={17} /></span>
                  </div>
                  <div className="overview-progress-row">
                    <div className="progress-ring" style={{ '--progress': `${progress}%` } as CSSProperties}>
                      <span>{completedCount}<small>/{dayTasks.length}</small></span>
                    </div>
                    <div className="progress-copy">
                      <strong>{remainingCount === 0 ? 'All wrapped up' : `${remainingCount} ${remainingCount === 1 ? 'thing' : 'things'} left`}</strong>
                      <span>{remainingCount === 0 ? 'Enjoy the breathing room.' : 'At your own pace.'}</span>
                    </div>
                  </div>
                  <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
                  <div className="overview-footnote"><Icon name="clock" size={14} /> {formatDuration(plannedMinutes)} planned today</div>
                </section>

                {reminderTask ? (
                  <section className="reminder-card">
                    <div className="reminder-topline">
                      <span className="reminder-icon"><Icon name="bell" size={17} /></span>
                      <span className="reminder-overline">{reminderTask.reminderMinutes !== null ? 'A GENTLE NUDGE' : 'COMING UP'}</span>
                      {reminderTask.snoozedUntil?.[selectedDate] && reminderTask.snoozedUntil[selectedDate] > Date.now() && <span className="snoozed-tag">Snoozed</span>}
                    </div>
                    <p className="reminder-time">{reminderTask.reminderMinutes === null ? 'UP NEXT' : reminderTask.reminderMinutes === 0 ? `AT START · ${formatClock(reminderTask.time)}` : `${reminderTask.reminderMinutes} MIN BEFORE · ${formatClock(reminderTask.time)}`}</p>
                    <h3>{reminderTask.title}</h3>
                    <p className="reminder-meta">{categoryFor(reminderTask.category).label} <span>·</span> {formatDuration(reminderTask.duration)}</p>
                    <div className="reminder-actions">
                      {reminderTask.reminderMinutes !== null && (
                        <button className="snooze-button" type="button" onClick={() => snoozeReminder(reminderTask)}>
                          <Icon name="clock" size={14} /> Snooze 10 min
                        </button>
                      )}
                      <button className="reminder-done-button" type="button" onClick={() => toggleComplete(reminderTask)} aria-label={`Mark ${reminderTask.title} done`}>
                        <Icon name="check" size={15} /> Done
                      </button>
                    </div>
                    {permission === 'default' && (
                      <button className="notification-permission-link" type="button" onClick={turnOnNotifications}>
                        <Icon name="bell" size={13} /> Turn on notifications
                      </button>
                    )}
                    {permission === 'granted' && <p className="notifications-on-note"><Icon name="check" size={12} /> Reminders are on for this device</p>}
                    {permission === 'denied' && <p className="notifications-on-note">Notifications are blocked in browser settings.</p>}
                  </section>
                ) : (
                  <section className="reminder-card reminder-card-quiet">
                    <div className="reminder-topline"><span className="reminder-icon"><Icon name="bell" size={17} /></span><span className="reminder-overline">A GENTLE NUDGE</span></div>
                    <h3>No reminders waiting</h3>
                    <p className="reminder-meta">Enjoy the quiet, or add a time to a task.</p>
                    {permission === 'default' && <button className="notification-permission-link" type="button" onClick={turnOnNotifications}><Icon name="bell" size={13} /> Turn on notifications</button>}
                  </section>
                )}

                <section className="carry-card">
                  <div className="carry-icon"><Icon name="arrowRight" size={17} /></div>
                  <div className="carry-copy">
                    <h3>Plans can change.</h3>
                    <p>{unfinishedOneOffs.length ? `${unfinishedOneOffs.length} unfinished ${unfinishedOneOffs.length === 1 ? 'task is' : 'tasks are'} easy to carry forward.` : 'Nothing unfinished to carry forward.'}</p>
                  </div>
                  <button className="carry-button" type="button" onClick={moveUnfinishedToTomorrow} disabled={!unfinishedOneOffs.length}>
                    Move to tomorrow <Icon name="arrowRight" size={15} />
                  </button>
                </section>
              </aside>
            </div>
          </>
        )}

        {view === 'week' && (
          <section className="week-view">
            <div className="week-view-heading">
              <div>
                <p className="eyebrow">YOUR WEEK</p>
                <h2>A week with room to breathe</h2>
                <p className="section-description">{formatWeekRange(weekFor(selectedDate))}</p>
              </div>
              <div className="week-view-controls">
                {weekFor(selectedDate) !== weekFor(today) && <button className="today-link week-today-link" type="button" onClick={() => setSelectedDate(today)}>Today</button>}
                <button className="date-strip-arrow" type="button" onClick={() => changeSelectedDate(-7)} aria-label="Previous week"><Icon name="chevronLeft" size={18} /></button>
                <button className="date-strip-arrow" type="button" onClick={() => changeSelectedDate(7)} aria-label="Next week"><Icon name="chevronRight" size={18} /></button>
                <button className="round-add-button week-add-button" type="button" onClick={() => openNewTask()} aria-label="Add a task" title="Add a task"><Icon name="plus" size={22} /></button>
              </div>
            </div>
            <div className="week-note"><span className="week-note-icon"><Icon name="sparkle" size={16} /></span> A week is a guide, not a contract. Move things around as you need.</div>
            <div className="week-grid" role="list" aria-label={`Week of ${formatWeekRange(weekFor(selectedDate))}`}>
              {weekDays.map((day) => {
                const selected = day === selectedDate;
                const isToday = day === today;
                const events = tasks.filter((task) => occursOn(task, day)).sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
                return (
                  <button
                    className={`week-day-column ${selected ? 'week-day-selected' : ''} ${isToday ? 'week-day-today' : ''}`}
                    type="button"
                    key={day}
                    onClick={() => { setSelectedDate(day); setView('day'); }}
                    aria-label={`${longDate(day)}, ${events.length} tasks. Open day timeline.`}
                  >
                    <span className="week-day-name">{WEEKDAY_NAMES[weekdayFor(day)]}</span>
                    <span className={`week-day-date ${selected ? 'week-day-date-selected' : ''}`}>{dateFromKey(day).getDate()}</span>
                    <span className="week-event-list">
                      {events.slice(0, 4).map((task) => (
                        <span className={`week-event week-event-${task.category} ${isDoneOn(task, day) ? 'week-event-done' : ''}`} key={task.id} title={`${formatClock(task.time)} · ${task.title}`}>
                          {task.time && <span className="week-event-time">{formatClock(task.time)}</span>}
                          <span className="week-event-title">{task.title}</span>
                        </span>
                      ))}
                      {events.length > 4 && <span className="week-more">+{events.length - 4} more</span>}
                      {!events.length && <span className="week-empty">A little open space</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="week-footer-note"><span className="local-note-dot" /> Your week is saved on this device.</div>
          </section>
        )}

        {view === 'routines' && (
          <section className="routines-view">
            <div className="routines-heading">
              <div>
                <p className="eyebrow">LITTLE THINGS, ON REPEAT</p>
                <h2>Your routines</h2>
                <p className="section-description">Set it once. We’ll make space for it again.</p>
              </div>
              <button className="primary-pill-button routine-create-button" type="button" onClick={() => openNewTask(true)}><Icon name="plus" size={17} /> New routine</button>
            </div>
            {routines.length ? (
              <div className="routine-list">
                {routines.map((task) => {
                  const category = categoryFor(task.category);
                  return (
                    <article className="routine-card" key={task.id}>
                      <span className={`category-tile category-${task.category}`}><Icon name={category.icon} size={19} /></span>
                      <div className="routine-copy">
                        <h3>{task.title}</h3>
                        <p>{repeatText(task)} <span>·</span> {task.time ? formatClock(task.time) : 'Anytime'} <span>·</span> {formatDuration(task.duration)}</p>
                      </div>
                      <span className="routine-repeat-mark"><Icon name="repeat" size={15} /></span>
                      <button className="routine-edit-button" type="button" onClick={() => openEditor(task)} aria-label={`Edit routine ${task.title}`}><Icon name="arrowUpRight" size={17} /></button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-routines-card">
                <span className="empty-illustration"><Icon name="repeat" size={24} /></span>
                <h3>Make room for a rhythm</h3>
                <p>Repeating tasks are here to make the little things easier to remember.</p>
                <button className="primary-pill-button" type="button" onClick={() => openNewTask(true)}><Icon name="plus" size={17} /> Create a routine</button>
              </div>
            )}
            <div className="routine-tip"><span className="week-note-icon"><Icon name="sparkle" size={16} /></span><span><strong>Keep it kind.</strong> Routines are gentle reminders, not rules. You can change them whenever life does.</span></div>
          </section>
        )}

        <footer className="main-footer"><span>Made for the day you have.</span><span className="footer-dot">·</span><span>Saved on this device</span></footer>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button type="button" key={item.id} className={`mobile-nav-link ${view === item.id ? 'mobile-nav-active' : ''}`} onClick={() => setView(item.id)} aria-current={view === item.id ? 'page' : undefined}>
            <Icon name={item.icon} size={19} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
      {view !== 'routines' && <button className="mobile-fab" type="button" aria-label="Add a task" onClick={() => openNewTask()}><Icon name="plus" size={24} /></button>}

      {composerOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false); }}>
          <form className="composer-modal" onSubmit={saveTask} role="dialog" aria-modal="true" aria-labelledby="composer-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{editingId ? 'A SMALL ADJUSTMENT' : 'QUICK CAPTURE'}</p>
                <h2 id="composer-title">{editingId ? 'Edit your plan' : view === 'routines' ? 'Start a little routine' : 'What’s on your mind?'}</h2>
                <p>{editingId ? 'Plans are allowed to move around.' : 'Add the thought. We’ll help it find a place.'}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setComposerOpen(false)} aria-label="Close"><Icon name="close" size={19} /></button>
            </div>

            <label className="field-label task-title-field">
              <span>Task name</span>
              <input
                autoFocus
                required
                maxLength={90}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Call the dentist"
              />
            </label>

            <div className="form-grid form-grid-two">
              <label className="field-label">
                <span><Icon name="calendar" size={14} /> Day</span>
                <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
              </label>
              <label className="field-label">
                <span><Icon name="clock" size={14} /> Start time <small>optional</small></span>
                <input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label className="field-label">
                <span>How long?</span>
                <select value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}>
                  {[15, 20, 30, 45, 60, 90, 120].map((minutes) => <option value={minutes} key={minutes}>{formatDuration(minutes)}</option>)}
                </select>
              </label>
              <label className="field-label">
                <span>Category</span>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Category }))}>
                  {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label className="field-label">
                <span><Icon name="bell" size={14} /> Remind me</span>
                <select value={form.reminderMinutes} onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: event.target.value }))}>
                  <option value="">No reminder</option>
                  <option value="0">At start time</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                </select>
              </label>
              <label className="field-label">
                <span><Icon name="repeat" size={14} /> Repeat</span>
                <select value={form.repeat} onChange={(event) => setForm((current) => ({ ...current, repeat: event.target.value as RepeatRule }))}>
                  <option value="none">Doesn’t repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                  <option value="custom">Choose days</option>
                </select>
              </label>
            </div>

            {form.repeat === 'custom' && (
              <div className="custom-days-control">
                <span className="custom-days-label">Repeat on</span>
                <div className="weekday-toggle-row">
                  {WEEKDAY_LETTERS.map((label, day) => (
                    <button type="button" key={`${label}-${day}`} className={`weekday-toggle ${form.days.includes(day) ? 'weekday-toggle-selected' : ''}`} aria-pressed={form.days.includes(day)} aria-label={WEEKDAY_NAMES[day]} onClick={() => setForm((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((value) => value !== day) : [...current.days, day].sort((a, b) => a - b) }))}>{label}</button>
                  ))}
                </div>
                {!form.days.length && <span className="field-hint">Choose at least one day for this routine.</span>}
              </div>
            )}

            <div className="modal-footer">
              <span className="modal-local-note"><span className="local-note-dot" /> Only you can see this plan</span>
              <button className="primary-pill-button modal-save-button" type="submit" disabled={form.repeat === 'custom' && form.days.length === 0}>
                {editingId ? 'Save changes' : form.repeat === 'none' ? 'Add to my day' : 'Save routine'} <Icon name="arrowRight" size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </div>
  );
}
