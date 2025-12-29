import { useIsOnline } from '@/components/OnlineStatusProvider';

interface SyncIndicatorProps {
  isSynced: boolean;
  className?: string;
}

/**
 * Discrete sync indicator component (reads global online status)
 * Doesn't render until online status is known (avoids hydration mismatch)
 */
export default function SyncIndicator({
  isSynced,
  className = '',
}: SyncIndicatorProps) {
  const isOnline = useIsOnline();

  // Don't render anything during SSR / before we know the real status
  if (typeof isOnline === 'undefined') return null;

  if (isSynced && isOnline) {
    return null; // Don't show anything when synced and online
  }

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs ${className}`}
      title={
        !isOnline
          ? 'Offline - será sincronizado quando online'
          : 'Não sincronizado'
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
        }`}
      />
    </div>
  );
}
