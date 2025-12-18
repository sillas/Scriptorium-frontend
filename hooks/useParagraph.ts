import { useRef, useState, useCallback, useEffect } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import { countWords } from '@/components/editor/utils/helpers';
import { 
  updateCursorPosition, 
  setCursorAt,
  handleDelete
} from '@/components/editor/utils/utils';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { ParagraphUpdate } from '@/components/editor/editorComponents/Paragraph';

const DEBOUNCE_DELAY_MS = 700;

interface UseParagraphProps {
  paragraph: ParagraphInterface;
  focusActivation?: { direction: NavigationDirection } | null;
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    isTheLastParagraphInChapter: boolean;
  };
  onTextChange: (paragraph: ParagraphInterface, updatedText: ParagraphUpdate) => void;
  onNavigate: (direction: NavigationDirection) => void;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  onRemoteSync: () => void;
  createNewParagraphInChapter: () => void;
}

export function useParagraph({
  paragraph,
  focusActivation,
  navigation,
  onTextChange,
  onNavigate,
  onDelete,
  onReorder,
  onRemoteSync,
  createNewParagraphInChapter,
}: UseParagraphProps) {
  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);

  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);
  
  const [characterCount, setCharacterCount] = useState(paragraph.text.length);
  const [wordCount, setWordCount] = useState(countWords(paragraph.text));
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  /**
   * Updates the cursor position state to track whether the cursor is at the first or last position
   * Used for navigation hints display
   */
  const handleCursorPositionUpdate = useCallback(() => {
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing]);

  /**
   * Handles paragraph activation when navigating from other paragraphs
   * Sets editing mode, scrolls element into view, and positions cursor based on navigation direction
   */
  useEffect(() => {    
    if (focusActivation) {
      setIsEditing(true);
      paragraphRef.current?.focus();

      // Scroll to ensure the element is visible in the center
      paragraphRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });

      if (focusActivation.direction === 'previous') {
        setCursorAt(paragraphRef, 'END');
      } else {
        setCursorAt(paragraphRef, 'START');
      }
    }
  }, [focusActivation]);

  /**
   * Sets up event listeners for cursor position tracking when in editing mode
   * Tracks keyup, mouseup, and focus events to update cursor position state
   */
  useEffect(() => {
    if (!isEditing) return;

    const element = paragraphRef.current;
    if( !element ) return;
    
    // Events that indicate cursor position change
    element.addEventListener('keyup', handleCursorPositionUpdate);
    element.addEventListener('mouseup', handleCursorPositionUpdate);
    element.addEventListener('focus', handleCursorPositionUpdate);

    return () => {
      element.removeEventListener('keyup', handleCursorPositionUpdate);
      element.removeEventListener('mouseup', handleCursorPositionUpdate);
      element.removeEventListener('focus', handleCursorPositionUpdate);
    };
  }, [isEditing, handleCursorPositionUpdate]);

  /**
   * Triggers a local save of the paragraph text if it has changed
   * Compares current text with previous text to avoid unnecessary updates
   */
  const triggerLocalSave = useCallback((forceUpdate = false) => {
    const newText = paragraphRef.current?.textContent?.trim() || '';

    if (!forceUpdate && newText === previousTextRef.current) return;
    previousTextRef.current = newText;

    onTextChange(paragraph, {
      text: newText,
      characterCount: newText.length,
      wordCount: countWords(newText),
      isQuote: isQuote || false,
      isHighlighted: isHighlighted || false,
      updatedAt: new Date(),
    });
  }, [paragraph, onTextChange, isQuote, isHighlighted]);

  /**
   * Schedules an auto-save operation after the debounce delay
   * Clears any existing timer to reset the debounce period
   * Also updates character and word counts based on current text
   */
  const scheduleAutoSave = useCallback(() => {    
    clearDebounceTimer();
    setDebounce(triggerLocalSave, DEBOUNCE_DELAY_MS);
    const text = paragraphRef.current?.textContent?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [clearDebounceTimer, setDebounce, triggerLocalSave]);

  /**
   * Completes the editing session
   * Saves changes locally, triggers remote sync if not already synced, and resets editing state
   */
  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    triggerLocalSave();

    if(paragraph.sync) return;
    onRemoteSync();
    paragraphRef.current?.blur();
    
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
  }, [onRemoteSync, triggerLocalSave, paragraph.sync]);

  /**
   * Finishes editing and navigates to another paragraph
   * @param event - The keyboard event to prevent default behavior
   * @param direction - The navigation direction ('previous' or 'next')
   */
  const handleFinishEditingAndNavigate = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
    event.preventDefault();
    handleFinishEditing();
    onNavigate(direction);
  }, [handleFinishEditing, onNavigate]);

  /**
   * Handles keyboard navigation and editing controls
   * - Tab: Navigate to next paragraph
   * - ArrowUp/ArrowDown: Navigate between paragraphs when cursor is at boundaries
   * - Enter/Escape: Finish editing
   * @param event - The keyboard event triggered by user input
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const pressedKey = event.key;

    // Go to next paragraph on Tab
    if (pressedKey === 'Tab' && isEditing && navigation.canNavigateNext) {
      handleFinishEditingAndNavigate(event, 'next');
      return;
    }

    // Navigate between paragraphs with ArrowUp and ArrowDown
    if(['ArrowUp', 'ArrowDown'].includes(pressedKey)) {
      if(event.ctrlKey) {
        event.preventDefault();
        onReorder(pressedKey === 'ArrowUp' ? 'up' : 'down');
        return;
      }
      
      if(pressedKey === 'ArrowUp' && isCursorAtFirstPosition && navigation.canNavigatePrevious) {
        handleFinishEditingAndNavigate(event, 'previous');
      }
      else if(pressedKey === 'ArrowDown' && isCursorAtLastPosition && navigation.canNavigateNext) {
        handleFinishEditingAndNavigate(event, 'next');
      }

      return;
    }

    // Create new paragraph on Enter if it's the last in chapter
    if(pressedKey === 'Enter' && navigation.isTheLastParagraphInChapter) {
      event.preventDefault();
      handleFinishEditing();
      createNewParagraphInChapter();
      return;
    }

    // Delete paragraph on Escape if it's the last in chapter and empty
    if (['Backspace', 'Escape'].includes(pressedKey) &&
      paragraphRef.current?.textContent?.trim() === ''
    ) {
      event.preventDefault();

      if( pressedKey === 'Backspace' ) {
        handleFinishEditingAndNavigate(event, 'previous');
      }

      onDelete();
      return;
    }

    // Finish editing on Enter or Escape
    if (['Enter', 'Escape'].includes(pressedKey)) {
      event.preventDefault();
      handleFinishEditing();
    }
  }, [
    isCursorAtFirstPosition, 
    isCursorAtLastPosition, 
    isEditing,
    navigation,
    onDelete,
    handleFinishEditingAndNavigate,
    createNewParagraphInChapter,
    handleFinishEditing,
    onReorder,
  ]);

  /**
   * Handles delete action with confirmation
   */
  const handleDeleteAction = useCallback(() => {
    handleDelete(paragraphRef.current?.textContent, onDelete);
  }, [onDelete]);

  /**
   * Toggle quote formatting
   */
  const toggleQuote = useCallback(() => {
    setIsQuote(prev => !prev);
  }, []);

  /**
   * Toggle highlight formatting
   */
  const toggleHighlight = useCallback(() => {
    setIsHighlighted(prev => !prev);
  }, []);

  /**
   * Updates local save when formatting changes
   */
  useEffect(() => {
    triggerLocalSave(true);
  }, [isQuote, isHighlighted, triggerLocalSave]);

  return {
    // Refs
    paragraphRef,
    
    // State
    isEditing,
    setIsEditing,
    isQuote,
    isHighlighted,
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    characterCount,
    wordCount,
    
    // Handlers
    handleKeyDown,
    handleFinishEditing,
    scheduleAutoSave,
    handleDeleteAction,
    toggleQuote,
    toggleHighlight,
  };
}
