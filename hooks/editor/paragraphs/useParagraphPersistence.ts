import { RefObject, useCallback, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { ParagraphInterface, textAlignmentType } from '@/components/editor/utils/interfaces';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { handleDeleteQuestion } from '@/components/editor/utils/utils';
import { countWords } from '@/components/editor/utils/helpers';

interface UseParagraphPersistenceParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  previousTextRef: RefObject<string>;
  paragraph: ParagraphInterface;
  emptyTextPlaceholder: string;
  debounceDelayMs: number;
  isQuote: boolean;
  isHighlighted: boolean;
  textAlignment: textAlignmentType;
  shouldForceLocalSave: boolean;
  shouldForceLocalDelete: boolean;
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
  previousTextRef,
  paragraph,
  emptyTextPlaceholder,
  debounceDelayMs,
  isQuote,
  isHighlighted,
  textAlignment,
  shouldForceLocalSave,
  shouldForceLocalDelete,
  setForceLocalSave,
  setForceLocalDelete,
  updateContentMetrics,
  onDelete,
}: UseParagraphPersistenceParams): UseParagraphPersistenceReturn {

  const prevStylesRef = useRef({ isQuote, isHighlighted, textAlignment });
  const { deleteLocal, SaveItemOnIndexedDB } = useLocalStorage();
  const [ setDebounce, clearDebounceTimer ] = useDebounceTimer();

  const saveLocalParagraph = useCallback((
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

    /// Build updated paragraph data
    const newData = {
      text: currentText,
      characterCount: characterCount,
      wordCount: wordCount,
      isQuote: isQuote || false,
      isHighlighted: isHighlighted || false,
      textAlignment: textAlignment,
    };

    SaveItemOnIndexedDB(paragraph, newData, 'paragraph');
  }, [SaveItemOnIndexedDB]);

  const deleteLocalParagraph = useCallback((
    paragraphRef: React.RefObject<HTMLDivElement | null>,
    paragraph: ParagraphInterface,
    text_placeholder: string,
  ) => {
    if (!onDelete) return;

    let text = (paragraphRef.current?.textContent || '').trim();
    if (text === text_placeholder) text = '';

    const result = handleDeleteQuestion(text, 'parágrafo');
    if (!result) return;

    onDelete();
    deleteLocal('paragraph', paragraph.id);
  }, [deleteLocal, onDelete]);

  const triggerLocalSave = useCallback(
    (forceUpdate: boolean = false) => {
      try {        
        saveLocalParagraph(
          paragraphRef,
          previousTextRef,
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
    clearDebounceTimer();
    setDebounce(triggerLocalSave, debounceDelayMs);
    updateContentMetrics();
  }, [clearDebounceTimer, setDebounce, triggerLocalSave, debounceDelayMs, updateContentMetrics]);

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
    deleteLocalParagraph(paragraphRef, paragraph, emptyTextPlaceholder);
    setForceLocalDelete(false);
  }, [
    shouldForceLocalDelete, 
    paragraph, emptyTextPlaceholder,
    deleteLocalParagraph,
    setForceLocalDelete
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
