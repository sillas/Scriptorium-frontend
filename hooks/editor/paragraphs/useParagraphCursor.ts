import { RefObject, useEffect, useState, Dispatch, SetStateAction, useCallback } from 'react';
import { NavigationDirection } from '@/components/editor/types';
import { setCursorAt } from '@/lib/editor/selection';

interface UseParagraphCursorParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  focusActivation?: { direction: NavigationDirection } | null;
}

interface UseParagraphCursorReturn {
  isCursorAtFirstPosition: boolean;
  isCursorAtLastPosition: boolean;
  cursorPosition: number;
  setIsCursorAtFirstPosition: Dispatch<SetStateAction<boolean>>;
  setIsCursorAtLastPosition: Dispatch<SetStateAction<boolean>>;
  resetCursorPosition: () => void;
  setCursorPosition: () => void;
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
  const [cursorPosition, setCursorPosition] = useState(0);

  const resetCursorPosition = () => {
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
  };

  const updateCursorPosition = useCallback(() => {
    const element = paragraphRef.current;
    if (!element) {
      setCursorPosition(0);
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Check if the selection is within the paragraph element
      if (!element.contains(range.startContainer)) {
        return;
      }

      // Create a range from the start of the element to the cursor
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      
      // Get the text content length up to the cursor
      const position = preCaretRange.toString().length;
      setCursorPosition(position);
    }, 0);
  }, []);

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
    cursorPosition,
    setCursorPosition: updateCursorPosition,
    setIsCursorAtFirstPosition,
    setIsCursorAtLastPosition,
    resetCursorPosition,
  };
}
