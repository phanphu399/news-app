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

    const handleOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        setJustReturned(true);
        const timer = setTimeout(() => setJustReturned(false), 3000);
        return () => clearTimeout(timer);
      }
    };
    const handleOffline = () => {
      wasOffline.current = true;
      setJustReturned(false);
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isWeb]);

  return { online, justReturned };
}