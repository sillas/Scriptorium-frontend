'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { 
  handleClick, 
  updateCursorPosition, 
  setCursorAt, 
  handleWordCount
} from '@/components/editor/utils/utils';

const DEBOUNCE_DELAY_MS = 700;

export interface ParagraphUpdate {
  text: string;
  characterCount: number;
  wordCount: number;
  isQuote: boolean;
  isHighlighted: boolean;
  updatedAt: Date;
}
interface ParagraphProps {
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
  onRemoteSync: () => void;
  createNewParagraphInChapter: () => void;
  createNewParagraphAbove: () => void;
}

export function Paragraph({
  paragraph,
  focusActivation,
  navigation,
  onTextChange,
  onNavigate,
  onDelete,
  onRemoteSync,
  createNewParagraphInChapter,
  createNewParagraphAbove,
}: ParagraphProps) {
  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);
  const [characterCount, setCharacterCount] = useState(paragraph.text.length);
  const [wordCount, setWordCount] = useState(
    handleWordCount(paragraph.text)
  );

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
  const triggerLocalSave = useCallback((forceUpdate = false) => {
    const newText = paragraphRef.current?.textContent.trim() || '';

    if (!forceUpdate && newText === previousTextRef.current) return;
    previousTextRef.current = newText;

    onTextChange(paragraph,{
      text: newText,
      characterCount: newText.length,
      wordCount: handleWordCount(newText),
      isQuote: isQuote || false,
      isHighlighted: isHighlighted || false,
      updatedAt: new Date(),
    });
  }, [onTextChange, isQuote, isHighlighted]);


  /**
   * Schedules an auto-save operation after the debounce delay
   * Clears any existing timer to reset the debounce period
   * Also updates character and word counts based on current text
   */
  const scheduleAutoSave = useCallback(() => {    
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
    let text = paragraphRef.current?.textContent.trim() || '';
    setCharacterCount(text.length);
    setWordCount(
      handleWordCount(text)
    );
  }, [
    isQuote,
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

  const handleDelete = useCallback(() => {
    let textLength = paragraphRef.current?.textContent.trim().length || 0;
    if(textLength && !confirm('Tem certeza que deseja deletar este parágrafo?')) return;
    onDelete();
  }, [onDelete]);

  useEffect(() => {
    triggerLocalSave(true);
  }, [isQuote, isHighlighted, triggerLocalSave]);


  const buttons_actions = useCallback(() => [
    { label: '“', action: () => {setIsQuote(!isQuote);}, style: 'text-5xl text-gray-500' },
    { label: '★', action: () => {setIsHighlighted(!isHighlighted);}, style: 'text-lg text-yellow-500' },
    { label: 'X', action: handleDelete, style: 'text-2xs text-red-400 font-bold' },
  ], [isQuote, isHighlighted, triggerLocalSave, handleDelete]);

  return (
    <>
      <button onClick={createNewParagraphAbove} className='relative flex items-center justify-center box-border w-full cursor-pointer border-2 border-transparent hover:border-dashed hover:border-slate-400/30 hover:rounded-t-md hover:text-gray-400 transition-colors duration-200'>
      +
      </button>
      <div className="relative flex flex-row items-stretch">
        {/* Botões laterais à esquerda, fora do fluxo do texto */}
        <div
          className={
            `flex flex-col items-center justify-center z-10 select-none transition-opacity duration-200 ` +
            `absolute -left-[2rem] top-0 h-full ` +
            `${isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
          }
          style={{ minWidth: '2rem' }}
        >
          {buttons_actions().map(({ label, action, style }) => (
            <button
              key={label}
              tabIndex={-1}
              className={`${isEditing ? 'pointer-events-auto' : 'pointer-events-none'} my-0.5 w-6 h-6 ${style} rounded bg-slate-100 border border-slate-200 shadow-sm hover:bg-slate-200 focus:outline-none cursor-pointer`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Parágrafo editável */}
        <div className={`${isEditing ? (isHighlighted ? 'border-4 border-yellow-200 shadow-sm' : 'bg-slate-200 shadow-sm'): (isHighlighted? 'bg-yellow-100 shadow-sm' : '')} rounded-md px-3 mb-1 text-slate-800 relative flex-1`}>  
          
          {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
            <span className="absolute left-0 top-0 text-gray-400 -translate-y-1/2">▲</span>
          )}

          {isQuote && (
            <div className="absolute pl-[3.5rem] left-0 top-0 text-gray-400 text-5xl select-none pointer-events-none" aria-hidden="true">
              “
            </div>
          )}

          <div
            ref={paragraphRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onClick={handleParagraphClick}
            onBlur={handleOnBlur}
            onInput={scheduleAutoSave}
            onKeyDown={handleKeyDown}
            className={`${isEditing ? 'rounded':( paragraph.text.length === 0 ? 'bg-slate-200' : '')} ${isQuote ? 'pl-[4rem] italic text-gray-600' : ''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
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
            <SyncIndicator isSynced={paragraph.sync} />
          </div>
        </div>
      </div>
    </>
  );
}
