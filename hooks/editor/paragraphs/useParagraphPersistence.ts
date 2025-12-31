import { RefObject, useCallback, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { ParagraphInterface, textAlignmentType } from '@/components/editor/utils/interfaces';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
  onDelete?: () => void;
  setForceLocalSave: Dispatch<SetStateAction<boolean>>;
  setForceLocalDelete: Dispatch<SetStateAction<boolean>>;
  updateContentMetrics: () => void;
}

interface UseParagraphPersistenceReturn {
  triggerLocalSave: (forceUpdate?: boolean) => Promise<void>;
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
  onDelete,
  setForceLocalSave,
  setForceLocalDelete,
  updateContentMetrics,
}: UseParagraphPersistenceParams): UseParagraphPersistenceReturn {

  const prevStylesRef = useRef({ isQuote, isHighlighted, textAlignment });
  const { saveLocalParagraph, deleteLocalParagraph } = useLocalStorage();
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  const triggerLocalSave = useCallback(
    async (forceUpdate = false) => {
      try {        
        await saveLocalParagraph(
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
      paragraphRef,
      previousTextRef,
      paragraph,
      isQuote,
      isHighlighted,
      textAlignment,
      emptyTextPlaceholder,
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
    deleteLocalParagraph(paragraphRef, paragraph, emptyTextPlaceholder, onDelete);
    setForceLocalDelete(false);
  }, [
    shouldForceLocalDelete, 
    paragraph, emptyTextPlaceholder,
    onDelete, deleteLocalParagraph,
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
