import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Trạng thái mạng toàn cục (web): online/offline qua navigator.onLine,
 * kèm cờ "vừa kết nối lại" hiện ngắn để hiện ● Đã kết nối.
 * Native không có netinfo → luôn coi online (feed realtime qua Supabase).
 */
export function useOnlineStatus() {
  const isWeb = Platform.OS === 'web';
  const initialOnline =
    typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  const [online, setOnline] = useState(() => (isWeb ? initialOnline : true));
  const [justReturned, setJustReturned] = useState(false);
  const wasOffline = useRef(!initialOnline);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    let disposed = false;
    let returnTimer = null;
    const clearReturnTimer = () => {
      if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
      }
    };

    const handleOnline = () => {
      if (disposed) return;
      setOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        clearReturnTimer();
        setJustReturned(true);
        returnTimer = setTimeout(() => {
          returnTimer = null;
          if (!disposed) setJustReturned(false);
        }, 3000);
      }
    };
    const handleOffline = () => {
      wasOffline.current = true;
      clearReturnTimer();
      if (disposed) return;
      setJustReturned(false);
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      disposed = true;
      clearReturnTimer();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isWeb]);

  return { online, justReturned };
}