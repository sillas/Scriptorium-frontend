import { useEffect, useState } from 'react';

/**
 * Hook to detect online/offline status
 * Returns `boolean | undefined` — `undefined` indicates we don't know the status during SSR
 */
export function useOnlineStatus(): boolean | undefined {
  const [isOnline, setIsOnline] = useState<boolean | undefined>(
    typeof navigator !== 'undefined' ? navigator.onLine : undefined
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
