import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initDB,
  saveToIndexedDB,
  // addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueRetry,
  SyncQueueItem,
} from '@/lib/indexedDB';
import { useOnlineStatus } from './useOnlineStatus';

const MAX_RETRY_COUNT = 3;

export interface SyncStatus {
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: Date | null;
  error: string | null;
}

/**
 * Hook to manage synchronization between IndexedDB and MongoDB
 */
export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    error: null,
  });
  
  const isOnline = useOnlineStatus();
  const syncInProgress = useRef(false);
  const previousOnlineStatus = useRef(isOnline);

  /**
   * Sync a single item with the remote MongoDB
   */
  const syncItem = async (item: SyncQueueItem): Promise<boolean> => {
    try {
      let endpoint = '';
      let method = 'POST';

      // Determine endpoint based on type and action
      switch (item.type) {
        case 'document':
          endpoint = '/api/documents';
          if (item.action === 'update') {
            endpoint = `/api/documents/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            endpoint = `/api/documents/${item.data.id}`;
            method = 'DELETE';
          }
          break;
        case 'chapter':
          endpoint = '/api/chapters';
          if (item.action === 'update') {
            endpoint = `/api/chapters/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            endpoint = `/api/chapters/${item.data.id}`;
            method = 'DELETE';
          }
          break;
        case 'paragraph':
          endpoint = '/api/paragraphs';
          if (item.action === 'update') {
            endpoint = `/api/paragraphs/${item.data.id}`;
            method = 'PUT';
          } else if (item.action === 'delete') {
            endpoint = `/api/paragraphs/${item.data.id}`;
            method = 'DELETE';
          }
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error syncing item:', error);
      return false;
    }
  };

  /**
   * Process the entire sync queue
   */
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncInProgress.current) {
      return;
    }

    syncInProgress.current = true;
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        setSyncStatus({
          isSyncing: false,
          pendingItems: 0,
          lastSyncTime: new Date(),
          error: null,
        });
        syncInProgress.current = false;
        return;
      }

      // Sort by timestamp to maintain order
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of sortedQueue) {
        const success = await syncItem(item);

        if (success) {
          await removeFromSyncQueue(item.id);
        } else {
          // Increment retry count
          const newRetryCount = item.retryCount + 1;
          
          if (newRetryCount >= MAX_RETRY_COUNT) {
            // Remove after max retries
            await removeFromSyncQueue(item.id);
            console.error('Item removed after max retries:', item);
          } else {
            await updateSyncQueueRetry(item.id, newRetryCount);
          }
        }
      }

      const remainingQueue = await getSyncQueue();
      setSyncStatus({
        isSyncing: false,
        pendingItems: remainingQueue.length,
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      console.error('Error processing sync queue:', error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline]);

  /**
   * Save document/chapter/paragraph to IndexedDB and queue for sync
   */
  const saveLocal = useCallback(
    async <T extends { id: string }>(
      type: 'document' | 'chapter' | 'paragraph',
      data: T,
      isNew: boolean = false
    ) => {
      try {

        await initDB();
        console.log(`initDB... ${type} - ? ${isNew?'yes':'no'}`);

        const storeName = `${type}s`;

        // Save to IndexedDB
        await saveToIndexedDB(storeName, data);
        

        // // Add to sync queue
        // const action = isNew ? 'create' : 'update';
        // await addToSyncQueue(type, action, data);

        // // Update pending count
        // const queue = await getSyncQueue();
        // setSyncStatus((prev) => ({
        //   ...prev,
        //   pendingItems: queue.length,
        // }));

        // Trigger sync if online
        // if (isOnline && !syncInProgress.current) {
        //   // Use setTimeout to avoid blocking the UI
        //   setTimeout(() => processSyncQueue(), 100);
        // }
      } catch (error) {
        console.error('Error in saveAndSync:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Manual sync trigger (Ctrl+S)
   */
  const manualSync = useCallback(async () => {
    if (isOnline) {
      await processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !previousOnlineStatus.current) {
      console.log('Connection restored, syncing...');
      processSyncQueue();
    }
    previousOnlineStatus.current = isOnline;
  }, [isOnline, processSyncQueue]);

  // Initialize DB on mount
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Update pending count on mount
  useEffect(() => {
    getSyncQueue().then((queue) => {
      setSyncStatus((prev) => ({
        ...prev,
        pendingItems: queue.length,
      }));
    });
  }, []);

  return {
    syncStatus,
    saveLocal,
    manualSync,
    isOnline,
  };
}
