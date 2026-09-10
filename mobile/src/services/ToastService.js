let listeners = [];
let seq = 0;

function notify(toast) {
  listeners.slice().forEach((listener) => listener(toast));
}

export function subscribeToasts(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

export function showToast({ type = 'info', title, message, duration = 4500 }) {
  const toast = { id: ++seq, type, title, message };
  notify(toast);
  setTimeout(() => dismissToast(toast.id), duration);
  return toast.id;
}

export function dismissToast(id) {
  notify({ id, dismiss: true });
}

export const ToastService = { showToast, dismissToast };