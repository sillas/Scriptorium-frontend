import { useCallback } from 'react';

import {
  initDB,
  saveToIndexedDB
} from '@/lib/indexedDB';

export function useLocalStorage() {

    const saveLocal = useCallback(
        async <T extends { id: string }>(
          type: 'document' | 'chapter' | 'paragraph',
          data: T
        ) => {
          try {
    
            await initDB();
            const storeName = `${type}s`;
    
            await saveToIndexedDB(storeName, data);
        
          } catch (error) {
            console.error('Error in saveAndSync:', error);
            throw error;
          }
        },
        []
      );

    const deleteLocal = useCallback(
        async (
          type: 'document' | 'chapter' | 'paragraph',
          id: string
        ) => {
          try {
            await initDB();
            const storeName = `${type}s`;
    
            const deletedData = {
              id,
              deleted: true,
              sync: false
            };
    
            await saveToIndexedDB(storeName, deletedData);
        
          } catch (error) {
            console.error('Error in deleteLocal:', id, error);
            throw error;
          }
        },
        []
      );
    
    return {
        saveLocal,
        deleteLocal
    };
}