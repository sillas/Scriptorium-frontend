import { RefObject, useCallback, useState, MouseEvent } from 'react';
import { handleClick } from '@/lib/editor/selection';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface UseParagraphEditingParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  syncedText: string;
  emptyTextPlaceholder: string;
  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;
  resetCursorPosition: () => void;
  onSave: () => void;
  onRemoteSync?: () => void;
}

interface UseParagraphEditingReturn {
  isEditing: boolean;
  handleStartEditing: () => void;
  handleFinishEditing: () => void;
  handleParagraphClick: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * Hook to manage paragraph editing state and transitions
 * Handles starting/finishing edit mode, placeholder management, and click events
 */
export function useParagraphEditing({
  paragraphRef, syncedText,
  emptyTextPlaceholder,
  selection, setSelection,
  resetCursorPosition,
  onSave, onRemoteSync,
}: UseParagraphEditingParams): UseParagraphEditingReturn {
  const [isEditing, setIsEditing] = useState(false);
  const { waitForPendingSaves } = useLocalStorage();
  
  const handleStartEditing = useCallback(() => {
    if (!paragraphRef.current || isEditing) return;

    setIsEditing(true);
    paragraphRef.current.focus();

    // Remove placeholder if present
    const currentText = paragraphRef.current.textContent?.trim() || '';
    if (currentText === emptyTextPlaceholder) {
      paragraphRef.current.textContent = '';
    }
  }, [paragraphRef, emptyTextPlaceholder, isEditing]);

  const handleFinishEditing = useCallback(() => {
    // Don't finish editing if text is selected (context menu open)
    if (selection) return;
    if (!paragraphRef.current) return;
    
    setIsEditing(false);
    setSelection(null);
    resetCursorPosition();

    // Add placeholder if text is empty
    let textToCompare = '';
    const text = (paragraphRef.current.textContent || '').trim();

    if (text.length === 0) {
      paragraphRef.current.textContent = emptyTextPlaceholder;
    } else {
      textToCompare = paragraphRef.current.innerHTML.replaceAll('&nbsp;', '').trim();
      paragraphRef.current.innerHTML = textToCompare;
    }

    if(textToCompare !== syncedText) {
      onSave();
      waitForPendingSaves().then(onRemoteSync);
    }

    paragraphRef.current?.blur();
  }, [
    paragraphRef,
    emptyTextPlaceholder,
    selection,
    setSelection,
    resetCursorPosition,
    onSave,
    onRemoteSync,
  ]);

  const handleParagraphClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setSelection(null);
      if (!paragraphRef.current) return;

      // Remove placeholder on click
      const text = paragraphRef.current.textContent?.trim() || '';
      if (text === emptyTextPlaceholder) {
        paragraphRef.current.textContent = '';
      }

      handleClick(event, paragraphRef, isEditing, setIsEditing);
    },
    [paragraphRef, emptyTextPlaceholder, isEditing, setSelection]
  );

  return {
    isEditing,
    handleStartEditing,
    handleFinishEditing,
    handleParagraphClick,
  };
}
