'use client';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { useIsOnline } from '@/components/OnlineStatusProvider';

interface SyncIndicatorProps {
  isSynced?: boolean; // Prop opcional para backward compatibility
  initialSynced?: boolean; // Estado inicial quando usado com ref
  className?: string;
}

export interface SyncIndicatorHandle {
  setSynced: (synced: boolean) => void;
}

/**
 * Discrete sync indicator component (reads global online status)
 * Doesn't render until online status is known (avoids hydration mismatch)
 * Exposes imperative handle to update sync status without causing parent re-renders
 * 
 * Pode ser usado de duas formas:
 * 1. Com prop isSynced (modo controlado - causa re-render no pai)
 * 2. Com ref + initialSynced (modo imperativo - sem re-render no pai)
 */
const SyncIndicator = forwardRef<SyncIndicatorHandle, SyncIndicatorProps>((
  { isSynced: controlledSynced, initialSynced = false, className = '' },
  ref
) => {
  const isOnline = useIsOnline();
  const [internalSynced, setInternalSynced] = useState(initialSynced);

  // Se isSynced é passado como prop, usa modo controlado
  const isControlled = controlledSynced !== undefined;
  const currentSynced = isControlled ? controlledSynced : internalSynced;

  useImperativeHandle(ref, () => ({
    setSynced: (synced: boolean) => {
      if (!isControlled) {
        setInternalSynced(synced);
      }
    },
  }), [isControlled]);

  // Sincroniza estado interno com prop controlada quando muda
  useEffect(() => {
    if (isControlled && controlledSynced !== undefined) {
      setInternalSynced(controlledSynced);
    }
  }, [isControlled, controlledSynced]);

  // Don't render anything during SSR / before we know the real status
  if (typeof isOnline === 'undefined') return null;

  if (currentSynced && isOnline) {
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
});

SyncIndicator.displayName = 'SyncIndicator';

export default SyncIndicator;
