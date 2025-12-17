'use client';

import React, { createContext, useContext } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const OnlineStatusContext = createContext<boolean | undefined>(undefined);

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  return (
    <OnlineStatusContext.Provider value={isOnline}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useIsOnline() {
  const ctx = useContext(OnlineStatusContext);
  if (typeof ctx === 'boolean') return ctx;
  // Fallback for cases when provider isn't mounted (e.g., tests or older code)
  return useOnlineStatus();
}
