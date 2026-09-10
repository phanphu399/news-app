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

/**
 * Hiển thị toast kiểu Fintech.
 * @param {object} opts
 * @param {'success'|'error'|'warning'|'info'} opts.type
 * @param {string} opts.title
 * @param {string} [opts.message] — mỗi dòng (xuống dòng) là một bullet.
 * @param {string} [opts.badge] — chữ badge footer, mặc định theo type.
 * @param {Array<{label:string, onPress?:Function, primary?:boolean}>} [opts.actions] — tối đa 2 nút CTA.
 * @param {number} [opts.duration]
 */
export function showToast({ type = 'info', title, message, duration = 4500, badge, actions } = {}) {
  const toast = { id: ++seq, type, title, message, badge, actions: actions || [] };
  notify(toast);
  setTimeout(() => dismissToast(toast.id), duration);
  return toast.id;
}

export function dismissToast(id) {
  notify({ id, dismiss: true });
}

export const ToastService = { showToast, dismissToast };