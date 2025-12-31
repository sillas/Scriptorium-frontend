import { useCallback } from 'react';
import { countWords } from '@/components/editor/utils/helpers';

import {
  initDB,
  saveToIndexedDB,
  deleteFromIndexedDB
} from '@/lib/indexedDB';

import {
  DocumentInterface, 
  ChapterInterface,
  ParagraphInterface,
  ParagraphUpdate,
  textAlignmentType
} from '@/components/editor/utils/interfaces';
import { TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { handleDeleteQuestion } from '@/components/editor/utils/utils';


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
        
            } catch (error) {
                console.error('Error in deleteLocal:', id, error);
                throw error;
            }
        }, []
    );
    
    /**
     * Save partial document data locally (does not include chapters).
     * Marks the document as unsynced and updates the `updatedAt` timestamp.
     * The saved object excludes nested `chapters` to keep local storage compact.
     *
     * @param localDocument - the current document object
     * @param data - partial document fields to update locally (e.g. title, subtitle)
     */
    const documentLocalSave = useCallback(async (
        localDocument: DocumentInterface,
        data: TitleUpdateData
      ): Promise<boolean> => {
    
        const toSave: DocumentInterface = {
          ...localDocument,
          ...data,
          updatedAt: new Date(),
          sync: false
        }
    
        const { ...toSaveLocal } = toSave;
    
        try {
          await saveLocal('document', toSaveLocal);
          return true;
        } catch (error) {
          console.error('Error saving document locally:', error);
          alert('Erro ao salvar o documento localmente.');
          return false;
        }
    
      }, [saveLocal]);
    
    /**
       * Save a chapter locally. Marks the chapter as unsynced and updates
       * `updatedAt` unless it was provided in `data`.
       * The saved object excludes `paragraphs` to keep local storage compact.
       *
       * @param chapter - the chapter object to save
       * @param data - optional partial updates to the chapter (e.g. title)
       */
      const chapterLocalSave = useCallback(async (
        chapter: ChapterInterface,
        data: TitleUpdateData | {} = {},
      ): Promise<boolean> => {
    
        const toSave: ChapterInterface = {
          ...chapter,
          ...data,
          sync: false,
        }
    
        // TODO: Add text validation.
        
        if( !(data as TitleUpdateData).updatedAt ) {
          toSave.updatedAt = new Date();
        }
        
        const { paragraphs, ...toSaveLocal } = toSave;
    
        try {
          await saveLocal('chapter', toSaveLocal);
          return true;
        } catch (error) {
          console.error('Error saving chapter locally:', error);
          alert('Erro ao salvar o capítulo localmente.');
          return false;
        }
    
      }, [saveLocal]);
    
    /**
       * Save a paragraph locally. If `textData` is provided, updates the
       * paragraph's text, word/character counts and `updatedAt` from it.
       * Marks the paragraph as unsynced.
       *
       * @param paragraph - the paragraph to save
       * @param textData - optional text update information (text, counts, updatedAt)
       */
      const SaveParagraphOnIndexedDB = useCallback(async (
        paragraph: ParagraphInterface,
        textData: ParagraphUpdate | {} = {},
      ): Promise<boolean> => {
    
        const localParagraph: ParagraphInterface = {
          ...paragraph,
          ...textData,
          sync: false,
        }
    
        // TODO: Add text validation.

        try {
          await saveLocal('paragraph', localParagraph);
          return true
        } catch (error) {
          console.error('Error saving paragraph locally:', error);
          alert('Erro ao salvar o parágrafo localmente.');
          return false;
        }
    
      }, [saveLocal]);

    /**
     * Delete a paragraph locally: removes it from the local document state
     * and deletes the unsynced entry from local storage / IndexedDB.
     *
     * @param localDocument - the current document object
     * @param paragraphId - id of the paragraph to delete
     * @param setLocalDocument - function to update the local document state
     */
    const handleDeleteParagraph = useCallback( async ( paragraphId: string ) => {
      await deleteLocal('paragraph', paragraphId);
    }, [deleteLocal]);

    const deleteLocalParagraph = useCallback((
      paragraphRef: React.RefObject<HTMLDivElement | null>,
      paragraph: ParagraphInterface,
      text_placeholder: string,
      onDelete?: () => void
    ) => {
        if (!onDelete) return;
        let text = (paragraphRef.current?.textContent || '').trim();
        if (text === text_placeholder) text = '';
        const result = handleDeleteQuestion(text, 'parágrafo');
        if (!result) return;
        onDelete();
        handleDeleteParagraph(paragraph.id);
      }, [handleDeleteParagraph]);
    
    const saveLocalParagraph = useCallback(async (
      paragraphRef: React.RefObject<HTMLDivElement | null>,
      previousTextRef: React.RefObject<string>,
      paragraph: ParagraphInterface,
      isQuote: boolean,
      isHighlighted: boolean,
      textAlignment: textAlignmentType,
      text_placeholder: string,
      forceUpdate = false,
    ) => {

      let characterCount = 0;
      let wordCount = 0;
      
      let currentText = (paragraphRef.current?.innerText || '').trim();
      if (currentText === text_placeholder) currentText = '';
      else {
        characterCount = currentText.length;
        wordCount = countWords(currentText);
        currentText = paragraphRef.current?.innerHTML || '';
      }
      
      if (!forceUpdate && currentText === previousTextRef.current) return;
      previousTextRef.current = currentText;

      await SaveParagraphOnIndexedDB(paragraph, {
        text: currentText,
        characterCount: characterCount,
        wordCount: wordCount,
        isQuote: isQuote || false,
        isHighlighted: isHighlighted || false,
        textAlignment: textAlignment,
        updatedAt: new Date(),
      });
    }, [SaveParagraphOnIndexedDB]);
    
    return {
        documentLocalSave,
        chapterLocalSave,
        saveLocalParagraph,
        deleteLocalParagraph,
        SaveParagraphOnIndexedDB
    };
}