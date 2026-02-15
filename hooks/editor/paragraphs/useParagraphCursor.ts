import { RefObject, useEffect, Dispatch, SetStateAction, useCallback, useRef, MutableRefObject } from 'react';
import { ActiveParagraphInterface } from '@/components/editor/types';
import { setCursorAt } from '@/lib/editor/selection';

interface UseParagraphCursorParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  focusActivation?: ActiveParagraphInterface | null;
}

interface UseParagraphCursorReturn {
  isCursorAtFirstPositionRef: RefObject<boolean>;
  isCursorAtLastPositionRef: RefObject<boolean>;
  cursorPositionRef: RefObject<number>;
  setIsCursorAtFirstPosition: Dispatch<SetStateAction<boolean>>;
  setIsCursorAtLastPosition: Dispatch<SetStateAction<boolean>>;
  resetCursorPosition: () => void;
  setCursorPosition: (afterUpdate?: CursorUpdateCallback) => void;
}

export type CursorUpdateCallback = (params: {
  position: number;
  totalLength: number;
  isAtFirst: boolean;
  isAtLast: boolean;
}) => void;

/**
 * Hook to manage cursor position state within a paragraph
 * Tracks whether cursor is at the first or last position for navigation
 */
export function useParagraphCursor({
  paragraphRef,
  focusActivation,
}: UseParagraphCursorParams): UseParagraphCursorReturn {
  const isCursorAtFirstPositionRef = useRef(false);
  const isCursorAtLastPositionRef = useRef(false);
  const cursorPositionRef = useRef(0);

  const resetCursorPosition = () => {
    isCursorAtFirstPositionRef.current = false;
    isCursorAtLastPositionRef.current = false;
    cursorPositionRef.current = 0;
  };

  const updateCursorPosition = useCallback((afterUpdate?: CursorUpdateCallback) => {
    const element = paragraphRef.current;
    if (!element) {
      cursorPositionRef.current = 0;
      afterUpdate?.({ position: 0, totalLength: 0, isAtFirst: true, isAtLast: true });
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
      cursorPositionRef.current = position;

      const totalLength = element.textContent?.length ?? 0;
      isCursorAtFirstPositionRef.current = position === 0;
      isCursorAtLastPositionRef.current = position === totalLength;

      afterUpdate?.({
        position,
        totalLength,
        isAtFirst: isCursorAtFirstPositionRef.current,
        isAtLast: isCursorAtLastPositionRef.current,
      });
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
    isCursorAtFirstPositionRef,
    isCursorAtLastPositionRef,
    cursorPositionRef,
    setCursorPosition: updateCursorPosition,
    setIsCursorAtFirstPosition: (value: SetStateAction<boolean>) => {
      isCursorAtFirstPositionRef.current =
        typeof value === 'function'
          ? (value as (prev: boolean) => boolean)(isCursorAtFirstPositionRef.current)
          : value;
    },
    setIsCursorAtLastPosition: (value: SetStateAction<boolean>) => {
      isCursorAtLastPositionRef.current =
        typeof value === 'function'
          ? (value as (prev: boolean) => boolean)(isCursorAtLastPositionRef.current)
          : value;
    },
    resetCursorPosition,
  };
}
