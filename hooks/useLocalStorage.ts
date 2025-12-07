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
    
    return {
        saveLocal
    };
}