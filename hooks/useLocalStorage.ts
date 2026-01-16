import { 
  Dispatch, SetStateAction, 
  useCallback, useEffect, 
  useRef } from 'react';

import {
  initDB, saveToIndexedDB,
  deleteFromIndexedDB
} from '@/lib/indexedDB';

import {
  ParagraphUpdate,
  ContentEntity, ContentEntityType,
  DocumentEntity, DocumentEntityType,
  DocumentInterface, ChapterInterface, ParagraphInterface,
} from '@/components/editor/types';
import { TitleUpdateData } from '@/components/editor/types';

export function useLocalStorage() {
  const pendingSavesRef = useRef<Set<Promise<any>>>(new Set());
  /**
 * Helper to track save operations and ensure they complete
 */
  const trackSaveOperation = useCallback((savePromise: Promise<any>) => {
    pendingSavesRef.current.add(savePromise);
    savePromise
      .finally(() => {
        pendingSavesRef.current.delete(savePromise);
      });
    return savePromise;
  }, []);

  /**
   * Wait for all pending save operations to complete
   */
  const waitForPendingSaves = useCallback(async () => {
    if (pendingSavesRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingSavesRef.current));
    }
  }, []);

  const saveLocal = useCallback(
    <T extends { id: string }>(
      storeName: DocumentEntityType,
      data: T
    ) => {
      try {
        trackSaveOperation((async (): Promise<void> => {
          await initDB();
          await saveToIndexedDB(storeName, data);
        })());
      } catch (error) {
        console.error('Error in saveAndSync:', error);
        throw error;
      }
    },
    []
  );

  const deleteLocal = useCallback(
    (
      storeName: DocumentEntityType,
      itemToDelete: ChapterInterface | ParagraphInterface | DocumentInterface
    ) => {
      const { id } = itemToDelete;

      try {
        trackSaveOperation((async (): Promise<void> => {
          await initDB();
          
          // If id starts with 'temp-', completely remove from IndexedDB
          if (id.startsWith('temp-')) {
            await deleteFromIndexedDB(storeName, id);
          } else {
            // Otherwise, mark as deleted but keep for sync
            const deletedData = {
              ...itemToDelete,
              deleted: true,
              sync: false
            };
            await saveToIndexedDB(storeName, deletedData);
          }
        })());
      } catch (error) {
        console.error('Error in deleteLocal:', id, error);
        throw error;
      }
  }, []);
  
  /**
   * Save a paragraph locally. If `textData` is provided, updates the
   * paragraph's text, word/character counts and `updatedAt` from it.
   * Marks the paragraph as unsynced.
   *
   * @param paragraph - the paragraph to save
   * @param textData - optional text update information (text, counts, updatedAt)
   */
  const SaveItemOnIndexedDB = useCallback((
    currentItem: DocumentEntity,
    newData: ParagraphUpdate | TitleUpdateData | null,
    itemType: DocumentEntityType
  ): boolean => {

    const setLocalItems: DocumentEntity = {
      ...currentItem,
      ...(newData || {}),
      updatedAt: newData?.updatedAt ?? new Date(),
      sync: false,
    }

    try {
      console.log('saveLocal! ', setLocalItems);
      
      saveLocal(itemType, setLocalItems);
      return true
    } catch (error) {
      console.error(`Error saving ${itemType} locally:`, error);
      alert(`Erro ao salvar o ${itemType} localmente.`);
      return false;
    }
  }, [saveLocal]);


  /**
 * Re-indexes paragraphs from a specific position and saves them
 * @param paragraphs - Array of paragraphs to update
 * @param fromIndex - Starting index for re-indexation
 */
  const reindexAndSave = useCallback((
    currentItems: ContentEntity[],
    fromIndex: number,
    itemType: ContentEntityType,
    setLocalItems: Dispatch<SetStateAction<any[]>>
  ) => {

    const updatedItems = [...currentItems];
    for (let i = fromIndex; i < currentItems.length; i++) {
      const updated = { ...currentItems[i], index: i };
      updatedItems[i] = updated;
      SaveItemOnIndexedDB(updated, null, itemType);
    }

    // Update UI immediately (optimistic update)
    setLocalItems(updatedItems);
  }, [SaveItemOnIndexedDB]);

  const handleDeleteAndReindex = useCallback(<T extends ContentEntity>(
    localItens: T[],
    itemsType: ContentEntityType,
    index: number,
    setItems: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    const updatedItens = [...localItens];
    const itemToDelete = updatedItens.splice(index, 1)[0];

    if(!itemToDelete) {
      throw new Error('No item found to delete');
    }

    deleteLocal(itemsType, itemToDelete)
    reindexAndSave(
      updatedItens, 
      index, 
      itemsType, 
      setItems as React.Dispatch<React.SetStateAction<ContentEntity[]>>
    );
  }, [deleteLocal, reindexAndSave]);

  // Handle beforeunload to ensure all IndexedDB operations complete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there are pending saves, prevent immediate unload
      if (pendingSavesRef.current.size > 0) {
        e.preventDefault();

        // Attempt to wait for pending saves (may not complete if user forces close)
        waitForPendingSaves().catch(err => {
          console.error('Error completing pending saves:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [waitForPendingSaves]);

  return {
    SaveItemOnIndexedDB,
    reindexAndSave,
    deleteLocal,
    handleDeleteAndReindex,
    waitForPendingSaves,
    trackSaveOperation,
  };
}