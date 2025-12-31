import { RefObject, useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';
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
  onDelete?: () => void;
  updateContentMetrics: () => void;
}

interface UseParagraphPersistenceReturn {
  triggerLocalSave: (forceUpdate?: boolean) => Promise<void>;
  scheduleLocalAutoSave: () => void;
  setForceLocalSave: Dispatch<SetStateAction<boolean>>;
  setForceLocalDelete: Dispatch<SetStateAction<boolean>>;
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
  onDelete,
  updateContentMetrics,
}: UseParagraphPersistenceParams): UseParagraphPersistenceReturn {
  const [shouldForceLocalSave, setForceLocalSave] = useState(false);
  const [shouldForceLocalDelete, setForceLocalDelete] = useState(false);

  const { saveLocalParagraph, deleteLocalParagraph } = useLocalStorage();
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  const triggerLocalSave = useCallback(
    async (forceUpdate = false) => {
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
    triggerLocalSave(true);
    setForceLocalSave(false);
  }, [shouldForceLocalSave, triggerLocalSave]);

  // Effect to trigger local delete when flagged
  useEffect(() => {
    if (!shouldForceLocalDelete) return;
    deleteLocalParagraph(paragraphRef, paragraph, emptyTextPlaceholder, onDelete);
    setForceLocalDelete(false);
  }, [shouldForceLocalDelete, deleteLocalParagraph, paragraphRef, paragraph, emptyTextPlaceholder, onDelete]);

  // Effect to trigger local save on style changes
  useEffect(() => {
    triggerLocalSave(true);
  }, [isQuote, isHighlighted, textAlignment, triggerLocalSave]);

  return {
    triggerLocalSave,
    scheduleLocalAutoSave,
    setForceLocalSave,
    setForceLocalDelete,
  };
}
