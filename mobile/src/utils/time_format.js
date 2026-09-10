const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(date, now = new Date()) {
  const input = toDate(date);
  const current = toDate(now) || new Date();
  if (!input) {
    return 'Vừa xong';
  }

  const seconds = Math.floor((current.getTime() - input.getTime()) / 1000);

  if (seconds < 60) {
    return 'Vừa xong';
  }

  if (seconds < HOUR) {
    const minutes = Math.floor(seconds / MINUTE);
    return `${minutes} phút trước`;
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    return `${hours} giờ trước`;
  }

  const days = Math.floor(seconds / DAY);
  return days === 1 ? 'Hôm qua' : `${days} ngày trước`;
}

export function formatUtcClock(date) {
  const input = toDate(date);
  if (!input) return '';
  return input.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}