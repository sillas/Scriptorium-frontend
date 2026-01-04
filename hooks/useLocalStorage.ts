import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';

import {
  initDB,
  saveToIndexedDB,
  deleteFromIndexedDB
} from '@/lib/indexedDB';

import {
  DocumentInterface,
  ParagraphUpdate,
  DocumentComponentsItems,
  DocumentComponentsItemsType
} from '@/components/editor/types';
import { TitleUpdateData } from '@/components/editor/editorComponents/Title';


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
      type: DocumentComponentsItemsType | 'document',
      data: T
    ) => {
      try {
        trackSaveOperation((async (): Promise<void> => {
          await initDB();
          const storeName = `${type}s`;
          await saveToIndexedDB(storeName, data);
        })());
      } catch (error) {
        console.error('Error in saveAndSync:', error);
        throw error;
      }
    },
    [trackSaveOperation]
  );

  const deleteLocal = useCallback(
    (
      type: DocumentComponentsItemsType | 'document',
      id: string
    ) => {
      try {
        trackSaveOperation((async (): Promise<void> => {
          await initDB();
          const storeName = `${type}s`;

          // If id starts with 'temp-', completely remove from IndexedDB
          if (id.startsWith('temp-')) {
            await deleteFromIndexedDB(storeName, id);
          } else {
            // Otherwise, mark as deleted but keep for sync
            const deletedData = {
              id,
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
    currentItem: DocumentComponentsItems | DocumentInterface,
    newData: ParagraphUpdate | TitleUpdateData | null,
    itemType: DocumentComponentsItemsType | 'document'
  ): boolean => {

    const setLocalItems: DocumentComponentsItems | DocumentInterface = {
      ...currentItem,
      ...(newData || {}),
      updatedAt: newData?.updatedAt ?? new Date(),
      sync: false,
    }

    try {
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
    currentItems: DocumentComponentsItems[],
    fromIndex: number,
    itemType: DocumentComponentsItemsType,
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

  const handleDeleteAndReindex = useCallback(<T extends DocumentComponentsItems>(
    localItens: T[],
    itemsType: DocumentComponentsItemsType,
    index: number,
    setItems: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    const updatedItens = [...localItens];
    const { id } = updatedItens.splice(index, 1)[0];
    deleteLocal(itemsType, id)
    reindexAndSave(
      updatedItens, 
      index, 
      itemsType, 
      setItems as React.Dispatch<React.SetStateAction<DocumentComponentsItems[]>>
    );
  }, [deleteLocal, reindexAndSave]);

  // Handle beforeunload to ensure all IndexedDB operations complete
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there are pending saves, prevent immediate unload
      if (pendingSavesRef.current.size > 0) {
        e.preventDefault();
        // e.returnValue = ''; // deprecated

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
  };
}