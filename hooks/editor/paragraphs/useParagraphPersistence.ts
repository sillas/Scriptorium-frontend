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
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();
  const previousTextRef = useRef('');

  const getCurrentText = useCallback((): string => {
    // textContent = plain text without line breaks
    // innerText = plain text with line breaks
    // innerHTML = HTML content for saving
    let currentText = (paragraphRef.current?.innerText || '').trim();
    if (currentText === emptyTextPlaceholder) currentText = '';
    else {
      currentText = paragraphRef.current?.innerHTML || '';
    }
    return currentText
  }, []);

  const saveLocalParagraph = useCallback((
    paragraph: ParagraphInterface,
    isQuote: boolean,
    isHighlighted: boolean,
    textAlignment: textAlignmentType,
    forceUpdate = false,
  ) => {
    const previousText = previousTextRef.current
    const currentText = getCurrentText();

    const textToCompare = currentText.replaceAll('&nbsp;', '').trim();
    if (!forceUpdate && textToCompare === previousText) {
      return;
    };

    setIsSynced(false);

    previousTextRef.current = textToCompare;

    /// Build updated paragraph data
    const newData = {
      text: currentText,
      characterCount: countCharacters(currentText),
      wordCount: countWords(currentText),
      isQuote: isQuote || false,
      isHighlighted: isHighlighted || false,
      textAlignment: textAlignment,
    };
    
    SaveItemOnIndexedDB(paragraph, newData, 'paragraphs');
  }, [paragraph.sync, SaveItemOnIndexedDB, setIsSynced, getCurrentText]);

  const deleteLocalParagraph = useCallback((
    paragraphRef: React.RefObject<HTMLDivElement | null>
  ): boolean => {
    let text = (paragraphRef.current?.textContent || '').trim();
    if (text === emptyTextPlaceholder) text = '';

    const result = handleDeleteQuestion(text, 'parágrafo');
    if (!result) return false;
    onDelete?.();
    return true;
  }, [onDelete]);

  const triggerLocalSave = useCallback(
    (forceUpdate: boolean = false) => {
      try {
        saveLocalParagraph(
          paragraph,
          isQuote,
          isHighlighted,
          textAlignment,
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
    clearDebounceTimer();
    setDebounce(triggerLocalSave, debounceDelayMs);
    updateContentMetrics();
  }, [debounceDelayMs, clearDebounceTimer, setDebounce, triggerLocalSave, updateContentMetrics]);

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
    const deleted = deleteLocalParagraph(paragraphRef);
    if (deleted) setForceLocalDelete(false);
  }, [
    shouldForceLocalDelete,
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

  useEffect(() => {
    previousTextRef.current = paragraph.text.replaceAll('&nbsp;', '').trim();
  }, [paragraph.text, getCurrentText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearDebounceTimer();
  }, [clearDebounceTimer]);

  return {
    triggerLocalSave,
    scheduleLocalAutoSave,
  };
}
