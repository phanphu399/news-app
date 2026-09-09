const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date, now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) {
    return 'Vừa xong';
  }

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}