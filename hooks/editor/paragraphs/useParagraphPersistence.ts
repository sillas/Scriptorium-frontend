import { RefObject, useCallback, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { ParagraphInterface, textAlignmentType } from '@/components/editor/types';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { handleDeleteQuestion } from '@/lib/editor/paragraph-helpers';
import { countWords, countCharacters } from '@/lib/editor/text-utils';

interface UseParagraphPersistenceParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  paragraph: ParagraphInterface;
  emptyTextPlaceholder: string;
  debounceDelayMs: number;
  isQuote: boolean;
  isHighlighted: boolean;
  textAlignment: textAlignmentType;
  shouldForceLocalSave: boolean;
  shouldForceLocalDelete: boolean;
  setIsSynced: Dispatch<SetStateAction<boolean>>;
  setForceLocalSave: Dispatch<SetStateAction<boolean>>;
  setForceLocalDelete: Dispatch<SetStateAction<boolean>>;
  updateContentMetrics: () => void;
  onDelete?: () => void;
}

interface UseParagraphPersistenceReturn {
  triggerLocalSave: (forceUpdate?: boolean) => void;
  scheduleLocalAutoSave: () => void;
}

/**
 * Hook to manage paragraph persistence (auto-save, manual save, delete)
 * Handles debouncing, force save/delete flags, and style change saves
 */
export function useParagraphPersistence({
  paragraphRef,
  paragraph,
  emptyTextPlaceholder,
  debounceDelayMs,
  isQuote,
  isHighlighted,
  textAlignment,
  shouldForceLocalSave,
  shouldForceLocalDelete,
  setIsSynced,
  setForceLocalSave,
  setForceLocalDelete,
  updateContentMetrics,
  onDelete,
}: UseParagraphPersistenceParams): UseParagraphPersistenceReturn {

  const prevStylesRef = useRef({ isQuote, isHighlighted, textAlignment });
  const { SaveItemOnIndexedDB } = useLocalStorage();
  const [ setDebounce, clearDebounceTimer ] = useDebounceTimer();
  const previousTextRef = useRef(paragraph.text);

  const saveLocalParagraph = useCallback((
    paragraphRef: React.RefObject<HTMLDivElement | null>,
    paragraph: ParagraphInterface,
    isQuote: boolean,
    isHighlighted: boolean,
    textAlignment: textAlignmentType,
    text_placeholder: string,
    forceUpdate = false,
  ) => {

    let characterCount = 0;
    let wordCount = 0;

    // textContent = plain text without line breaks
    // innerText = plain text with line breaks
    // innerHTML = HTML content for saving
    let currentText = (paragraphRef.current?.innerText || '').trim();
    if (currentText === text_placeholder) currentText = '';
    else {
      characterCount = countCharacters(currentText);
      wordCount = countWords(currentText);
      currentText = paragraphRef.current?.innerHTML || '';
    }

    const textToCompare = currentText.replaceAll('&nbsp;', '').trim();
    if (!forceUpdate && textToCompare === previousTextRef.current) {
      setIsSynced(true);
      return;
    };

    previousTextRef.current = textToCompare;

    /// Build updated paragraph data
    const newData = {
      text: currentText,
      characterCount: characterCount,
      wordCount: wordCount,
      isQuote: isQuote || false,
      isHighlighted: isHighlighted || false,
      textAlignment: textAlignment,
    };

    SaveItemOnIndexedDB(paragraph, newData, 'paragraphs');
  }, [SaveItemOnIndexedDB, setIsSynced]);

  const deleteLocalParagraph = useCallback((
    paragraphRef: React.RefObject<HTMLDivElement | null>,
    text_placeholder: string,
  ):boolean => {
    let text = (paragraphRef.current?.textContent || '').trim();
    if (text === text_placeholder) text = '';

    const result = handleDeleteQuestion(text, 'parágrafo');
    if (!result) return false;
    onDelete?.();
    return true;
  }, [onDelete]);

  const triggerLocalSave = useCallback(
    (forceUpdate: boolean = false) => {
      try {        
        saveLocalParagraph(
          paragraphRef,
          paragraph,
          isQuote,
          isHighlighted,
          textAlignment,
          emptyTextPlaceholder,
          forceUpdate
        );
      } catch (error) {
        console.error('triggerLocalSave - Error saving paragraph locally:', error);
      }
    },
    [
      paragraph,
      isQuote,
      isHighlighted,
      textAlignment,
      saveLocalParagraph,
    ]
  );

  const scheduleLocalAutoSave = useCallback(() => {
    setIsSynced(false);
    clearDebounceTimer();
    setDebounce(triggerLocalSave, debounceDelayMs);
    updateContentMetrics();
  }, [debounceDelayMs, clearDebounceTimer, setIsSynced, setDebounce, triggerLocalSave, updateContentMetrics]);

  // Effect to trigger local save when flagged
  useEffect(() => {
    if (!shouldForceLocalSave) return;
    setForceLocalSave(false);
    clearDebounceTimer();
    triggerLocalSave(true);
  }, [shouldForceLocalSave, clearDebounceTimer, triggerLocalSave, setForceLocalSave]);

  // Effect to trigger local delete when flagged
  useEffect(() => {
    if (!shouldForceLocalDelete) return;
    const deleted = deleteLocalParagraph(paragraphRef, emptyTextPlaceholder);
    if(deleted) setForceLocalDelete(false);
  }, [
    shouldForceLocalDelete, emptyTextPlaceholder,
    deleteLocalParagraph, setForceLocalDelete
  ]);

  // Effect to trigger local save on style changes
  useEffect(() => {
    const prev = prevStylesRef.current;
    const hasChanged = prev.isQuote !== isQuote || 
                     prev.isHighlighted !== isHighlighted || 
                     prev.textAlignment !== textAlignment;
    if (!hasChanged) return;

    prevStylesRef.current = { isQuote, isHighlighted, textAlignment };
    clearDebounceTimer();
    triggerLocalSave(true);
  }, [isQuote, isHighlighted, textAlignment, clearDebounceTimer, triggerLocalSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearDebounceTimer();
  }, [clearDebounceTimer]);

  return {
    triggerLocalSave,
    scheduleLocalAutoSave,
  };
}
