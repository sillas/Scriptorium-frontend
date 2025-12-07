import React from 'react';

interface SyncIndicatorProps {
  isSynced: boolean;
  isOnline: boolean;
  className?: string;
}

/**
 * Discrete sync indicator component
 */
export default function SyncIndicator({
  isSynced,
  isOnline,
  className = '',
}: SyncIndicatorProps) {
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
          isOnline ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span className="text-gray-500">
        {!isOnline ? 'Offline' : ''}
      </span>
    </div>
  );
}
