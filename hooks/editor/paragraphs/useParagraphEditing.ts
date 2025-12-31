import { RefObject, useCallback, useState } from 'react';
import { handleClick } from '@/components/editor/utils/utils';

interface UseParagraphEditingParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  emptyTextPlaceholder: string;
  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;
  resetCursorPosition: () => void;
  onSave: () => Promise<void>;
  onRemoteSync?: () => void;
}

interface UseParagraphEditingReturn {
  isEditing: boolean;
  handleStartEditing: () => void;
  handleFinishEditing: () => Promise<void>;
  handleParagraphClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Hook to manage paragraph editing state and transitions
 * Handles starting/finishing edit mode, placeholder management, and click events
 */
export function useParagraphEditing({
  paragraphRef,
  emptyTextPlaceholder,
  selection,
  setSelection,
  resetCursorPosition,
  onSave,
  onRemoteSync,
}: UseParagraphEditingParams): UseParagraphEditingReturn {
  const [isEditing, setIsEditing] = useState(false);

  const handleStartEditing = useCallback(() => {
    if (!paragraphRef.current || isEditing) return;

    setIsEditing(true);
    paragraphRef.current.focus();

    // Scroll to ensure the element is visible in the center
    paragraphRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Remove placeholder if present
    const currentText = paragraphRef.current.textContent?.trim() || '';
    if (currentText === emptyTextPlaceholder) {
      paragraphRef.current.textContent = '';
    }
  }, [paragraphRef, emptyTextPlaceholder, isEditing]);

  const handleFinishEditing = useCallback(async () => {
    // Don't finish editing if text is selected (context menu open)
    if (selection) return;

    if (!paragraphRef.current) return;

    setIsEditing(false);
    setSelection(null);
    resetCursorPosition();

    // Add placeholder if text is empty
    const text = paragraphRef.current.textContent?.trim() || '';
    if (text.length === 0) {
      paragraphRef.current.textContent = emptyTextPlaceholder;
    }

    // Save and sync
    await onSave();
    onRemoteSync?.();

    paragraphRef.current.blur();
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
    (event: React.MouseEvent<HTMLDivElement>) => {
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
