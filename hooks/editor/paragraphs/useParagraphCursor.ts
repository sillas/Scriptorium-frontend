import { RefObject, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { NavigationDirection } from '@/components/editor/types';
import { setCursorAt } from '@/lib/editor/selection';

interface UseParagraphCursorParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  focusActivation?: { direction: NavigationDirection } | null;
}

interface UseParagraphCursorReturn {
  isCursorAtFirstPosition: boolean;
  isCursorAtLastPosition: boolean;
  setIsCursorAtFirstPosition: Dispatch<SetStateAction<boolean>>;
  setIsCursorAtLastPosition: Dispatch<SetStateAction<boolean>>;
  resetCursorPosition: () => void;
}

/**
 * Hook to manage cursor position state within a paragraph
 * Tracks whether cursor is at the first or last position for navigation
 */
export function useParagraphCursor({
  paragraphRef,
  focusActivation,
}: UseParagraphCursorParams): UseParagraphCursorReturn {
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);

  const resetCursorPosition = () => {
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
  };

  // Effect to handle focus activation from navigation
  useEffect(() => {
    if (!focusActivation) return;
    
    if (focusActivation.direction === 'Up') {
      setCursorAt(paragraphRef, 'END');
    } else {
      setCursorAt(paragraphRef, 'START');
    }
  }, [focusActivation, paragraphRef]);

  return {
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    setIsCursorAtFirstPosition,
    setIsCursorAtLastPosition,
    resetCursorPosition,
  };
}
