import { RefObject, useCallback } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/types';

interface UseParagraphNavigationParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  isNavigatingRef: RefObject<boolean>;
  paragraph: ParagraphInterface;
  emptyTextPlaceholder: string;
  isEditing: boolean;
  isCursorAtFirstPosition: boolean;
  isCursorAtLastPosition: boolean;
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    isTheLastParagraphInChapter: boolean;
  };
  handleFinishEditing: () => void;
  onNavigate?: (event: React.KeyboardEvent<HTMLDivElement>, direction: NavigationDirection) => void;
  onCreateNewParagraph?: (paragraphIndex: number | null) => void;
  onReorder?: (direction: NavigationDirection) => void;
  setIsSynced: React.Dispatch<React.SetStateAction<boolean>>;
  setForceLocalDelete: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseParagraphNavigationReturn {
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  handleScrolling: () => void;
}

/**
 * Hook to manage paragraph navigation via keyboard
 * Handles Arrow keys, Tab, Enter, Escape, and Backspace for navigation
 */
export function useParagraphNavigation({
  paragraphRef,
  isNavigatingRef,
  paragraph,
  emptyTextPlaceholder,
  isEditing,
  isCursorAtFirstPosition,
  isCursorAtLastPosition,
  navigation,
  handleFinishEditing,
  onNavigate,
  onCreateNewParagraph,
  onReorder,
  setIsSynced,
  setForceLocalDelete,
}: UseParagraphNavigationParams): UseParagraphNavigationReturn {
  
  const handleScrolling = useCallback(() => {
    if(!isNavigatingRef.current) return;
      isNavigatingRef.current = false;
      
      // Scroll to ensure the element is visible in the center
      paragraphRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, []);

  const handleFinishEditingAndNavigate = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, direction: NavigationDirection) => {
      isNavigatingRef.current = true;
      handleFinishEditing();
      onNavigate?.(event, direction);
    },
    [handleFinishEditing, onNavigate]
  );

  const goToParagraphOnArrows = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, direction: NavigationDirection) => {
      const canNavigate =
        direction === 'Down' ? navigation.canNavigateNext : navigation.canNavigatePrevious;
      if (!canNavigate) return;

      // Navigate only if cursor is at edge
      const isAtEdge =
        direction === 'Up' ? isCursorAtFirstPosition : isCursorAtLastPosition;

      if (isAtEdge) {
        event.preventDefault();
        handleFinishEditingAndNavigate(event, direction);
      }
    },
    [
      navigation,
      isCursorAtFirstPosition,
      isCursorAtLastPosition,
      handleFinishEditingAndNavigate,
    ]
  );

  const goToParagraphOnTab = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const direction: NavigationDirection = event.shiftKey ? 'Up' : 'Down';
      const shouldNavigate =
        (direction === 'Down' && navigation.canNavigateNext) ||
        (direction === 'Up' && navigation.canNavigatePrevious);

      if (shouldNavigate) {
        handleFinishEditingAndNavigate(event, direction);
      }
    },
    [navigation, handleFinishEditingAndNavigate]
  );

  const handleEnterKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Allow line break with Shift+Enter
      if (event.shiftKey) return;

      event.preventDefault();

      // Create new paragraph at end of chapter
      if (navigation.isTheLastParagraphInChapter) {
        handleFinishEditing();
        onCreateNewParagraph?.(null);
        return;
      }

      // Create new paragraph in between with Ctrl+Enter
      if (event.ctrlKey) {
        handleFinishEditing();
        onCreateNewParagraph?.(paragraph.index + 1);
        return;
      }

      // Default: navigate to next paragraph
      handleFinishEditingAndNavigate(event, 'Down');
    },
    [
      navigation,
      paragraph.index,
      handleFinishEditing,
      onCreateNewParagraph,
      handleFinishEditingAndNavigate,
    ]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const pressedKey = event.key;

      // Go to previous or next paragraph on Arrow Up/Down
      if (['ArrowUp', 'ArrowDown'].includes(pressedKey)) {
        const direction = pressedKey === 'ArrowUp' ? 'Up' : 'Down';

        // Reorder paragraph with Ctrl+Arrow
        if (event.ctrlKey) {
          event.preventDefault();

          setIsSynced(false);
          onReorder?.(direction);

          setTimeout(() => {
            isNavigatingRef.current = true;
            handleScrolling();
          }, 0);
          return;
        }

        goToParagraphOnArrows(event, direction);
        return;
      }

      // Go to previous or next paragraph on Tab
      if (pressedKey === 'Tab' && isEditing) {
        goToParagraphOnTab(event);
        return;
      }

      // Handle Enter key
      if (pressedKey === 'Enter' && isEditing) {
        handleEnterKeyPress(event);
        return;
      }

      const currentText = paragraphRef.current?.textContent?.trim() || '';

      // Finish editing on Escape
      if (pressedKey === 'Escape' && currentText.length > 0) {
        event.preventDefault();
        handleFinishEditing();
        return;
      }

      // Delete paragraph on Escape/Backspace if it's empty
      if (['Backspace', 'Escape'].includes(pressedKey) && currentText === '') {
        event.preventDefault();

        if (pressedKey === 'Backspace') {
          const direction: NavigationDirection = navigation.canNavigatePrevious ? 'Up' : null;
          handleFinishEditingAndNavigate(event, direction);
        }

        setForceLocalDelete(true);
        return;
      }
    },
    [
      paragraph,
      emptyTextPlaceholder,
      isEditing,
      navigation,
      isCursorAtFirstPosition,
      isCursorAtLastPosition,
      handleFinishEditing,
      handleFinishEditingAndNavigate,
      setForceLocalDelete,
      onReorder,
      setIsSynced,
      goToParagraphOnArrows,
      goToParagraphOnTab,
      handleEnterKeyPress,
      handleScrolling
    ]
  );

  return {
    handleKeyDown,
    handleScrolling,
  };
}
