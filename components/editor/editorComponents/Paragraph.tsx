'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { 
  handleClick, 
  updateCursorPosition, 
  setCursorAt, 
  handleWordCount
} from '@/components/editor/utils/utils';

const DEBOUNCE_DELAY_MS = 700;

export type NavigationDirection = 'previous' | 'next' | null;

export interface ParagraphUpdate {
  text: string;
  characterCount: number;
  wordCount: number;
  isQuote: boolean;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  focusActivation?: {
    direction: NavigationDirection;
  } | null;
  isOnline: boolean;
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    isTheLastParagraphInChapter: boolean;
  };
  onTextChange: (updatedText: ParagraphUpdate) => void;
  onNavigate: (direction: NavigationDirection) => void;
  onRemoteSync: () => void;
  createNewParagraphInChapter: () => void;
  onDelete: () => void;
}

export function Paragraph({
  paragraph,
  focusActivation,
  navigation,
  isOnline = true,
  onTextChange,
  onRemoteSync,
  onNavigate,
  createNewParagraphInChapter,
  onDelete,
}: ParagraphProps) {
  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);
  const [characterCount, setCharacterCount] = useState(paragraph.text.length);
  const [wordCount, setWordCount] = useState(
    handleWordCount(paragraph.text)
  );

  // TODO: Implement "isQuote"

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
  }, [isEditing]);

  /**
   * Clears the active debounce timer if one exists
   * Used to cancel pending auto-save operations
   */
  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimerRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  /**
   * Cleanup effect to clear debounce timer when component unmounts
   */
  useEffect(() => {
    return () => clearDebounceTimer();
  }, [clearDebounceTimer]);

  /**
   * Triggers a local save of the paragraph text if it has changed
   * Compares current text with previous text to avoid unnecessary updates
   */
  const triggerLocalSave = useCallback(() => {
    const newText = paragraphRef.current?.textContent.trim() || '';
    if (newText === previousTextRef.current) return;

    previousTextRef.current = newText;

    onTextChange({
      text: newText,
      characterCount: newText.length,
      wordCount: handleWordCount(newText),
      isQuote: paragraph.isQuote || false,
      updatedAt: new Date(),
    });
  }, [onTextChange]);


  /**
   * Schedules an auto-save operation after the debounce delay
   * Clears any existing timer to reset the debounce period
   * Also updates character and word counts based on current text
   */
  const scheduleAutoSave = useCallback(() => {    
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
    const text = paragraphRef.current?.textContent.trim() || '';
    setCharacterCount(text.length);
    setWordCount(
      handleWordCount(text)
    );
  }, [
    triggerLocalSave,
    clearDebounceTimer,
    setCharacterCount,
    setWordCount
  ]);


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
      return
    }

    
    // Delete paragraph on Escape if it's the last in chapter and empty
    if (['Backspace', 'Escape'].includes(pressedKey) && 
      navigation.isTheLastParagraphInChapter &&
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
    paragraphRef,
    onDelete,
    handleFinishEditingAndNavigate,
    createNewParagraphInChapter,
    handleFinishEditing, 
  ]);

  /**
   * Handles the blur event when the paragraph loses focus
   * Triggers the finish editing flow to save changes
   */
  const handleOnBlur = useCallback(() => {
    handleFinishEditing();
  }, [handleFinishEditing, onNavigate]);

  /**
   * Handles click events on the paragraph element.
   * @param event - The React mouse event triggered by clicking the paragraph
   */
  const handleParagraphClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    handleClick(event, paragraphRef, isEditing, setIsEditing);
  }, [isEditing]);

  return (
    <div className={`${isEditing ? 'bg-slate-200 shadow-sm':''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      
      {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
        <span className="absolute left-0 top-0 text-gray-400 -translate-y-1/2">▲</span>
      )}

      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleParagraphClick}
        onBlur={handleOnBlur}
        onInput={scheduleAutoSave}
        onKeyDown={handleKeyDown}
        className={`${isEditing ? 'rounded':''} ${paragraph.isQuote ? 'pl-4 italic text-gray-600' : ''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
      >
        {paragraph.text}
      </div>

      { isEditing && (
        <span className="absolute right-0 bottom-0 text-gray-400 bg-slate-100 rounded px-2 translate-y-1/2">
          {characterCount} chars • {wordCount} words
        </span>
      )}

      {isCursorAtLastPosition && navigation.canNavigateNext && (
        <span className="absolute left-0 bottom-0 text-gray-400 translate-y-1/2">▼</span>
      )}
    
      <div className="absolute top-0 right-0">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>
    </div>
  );
}
