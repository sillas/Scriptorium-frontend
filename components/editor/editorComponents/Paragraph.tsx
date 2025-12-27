'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { countWords } from '@/components/editor/utils/helpers';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { paragraphStyles as pStyle } from '@/components/editor/utils/paragraphStyles';
import { 
  handleClick,
  setCursorAt,
  handleRightClick,
  handleDeleteQuestion,
  updateCursorPosition
} from '@/components/editor/utils/utils';

// import { useParagraph } from '@/hooks/useParagraph';

const DEBOUNCE_DELAY_MS = 700;
const EMPTY_TEXT_PLACEHOLDER = 'Clique para editar este parágrafo...';
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
  onDelete?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  onCreateNewParagraph?: (paragraphIndex: number | null) => void;
  // onReorder?: (direction: 'Up' | 'Down') => void;
  // onRemoteSync?: () => void;
}

export function Paragraph({
  paragraph, focusActivation, navigation, onNavigate, onDelete, onCreateNewParagraph
}: ParagraphProps) {
 
  const paragraphRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef(paragraph.text);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);    
  const [characterCount, setCharacterCount] = useState(paragraph.text?.trim().length || 0);
  const [wordCount, setWordCount] = useState(countWords(paragraph.text));
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);
  // Custom hooks
  const { paragraphLocalSave, deleteParagraph } = useLocalStorage();
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  // Effect to set initial content
  useEffect(() => {
    if (!paragraphRef.current) return;
    let content = paragraph.text
    if (paragraph.text.length === 0) {
      content = EMPTY_TEXT_PLACEHOLDER;
    }
    paragraphRef.current.innerText = content
  }, [paragraph.text]);
  
  // Local Storage Functions --------------

  const triggerLocalSave = useCallback(async (forceUpdate = false) => {
      let newText = paragraphRef.current?.innerText?.trim() || '';
      if(newText === EMPTY_TEXT_PLACEHOLDER) newText = ''

      if (!forceUpdate && newText === previousTextRef.current) return;
      previousTextRef.current = newText;
      
      await paragraphLocalSave(paragraph, {
        text: newText,
        characterCount: newText.length,
        wordCount: countWords(newText),
        isQuote: isQuote || false,
        isHighlighted: isHighlighted || false,
        updatedAt: new Date(),
      });
  }, [paragraph, isQuote, isHighlighted]);

  const scheduleLocalAutoSave = useCallback(() => {    
    clearDebounceTimer();
    setDebounce(triggerLocalSave, DEBOUNCE_DELAY_MS);

    const text = paragraphRef.current?.innerText?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [clearDebounceTimer, setDebounce, triggerLocalSave]);
  
  const onCreateNewParagraphAbove = useCallback(() => {
    onCreateNewParagraph && onCreateNewParagraph(paragraph.index);
  }, [paragraph.index, onCreateNewParagraph]);

  // Handle functions ----------------------    

  const handleFinishEditing = useCallback(async () => {
    setIsEditing(false);
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
    
    const text = paragraphRef.current!.textContent.trim() || '';    
    if(text.length === 0) paragraphRef.current!.textContent = EMPTY_TEXT_PLACEHOLDER;
    await triggerLocalSave();
    paragraphRef.current?.blur();
  }, [triggerLocalSave, isEditing]);


  const handleParagraphClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if(!paragraphRef.current) return;

    const text = paragraphRef.current?.textContent?.trim() || '';
    if(text === EMPTY_TEXT_PLACEHOLDER) paragraphRef.current!.textContent = '';

    handleClick(event, paragraphRef, isEditing, setIsEditing);
  }, [isEditing]);


  // Navigation ------------------------

  const handleFinishEditingAndNavigate = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
    event.preventDefault();
    handleFinishEditing();
    onNavigate && onNavigate(direction);
  }, [handleFinishEditing, onNavigate]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const pressedKey = event.key;

    // Go to previous or next paragraph on Arrow Up/Down
    if(['ArrowUp', 'ArrowDown'].includes(pressedKey)) {
      const direction = pressedKey === 'ArrowUp'? 'previous' : 'next';
      const shouldNavigate = 
        (direction === 'previous' && isCursorAtFirstPosition && navigation.canNavigatePrevious) ||
        (direction === 'next' && isCursorAtLastPosition && navigation.canNavigateNext);
      
      if(shouldNavigate) {
        handleFinishEditingAndNavigate(event, direction);
      }
      return;
    }

    // Go to previous or next paragraph on Tab
    if (pressedKey === 'Tab' && isEditing) {

      const direction = event.shiftKey ? 'previous':'next';
      const shouldNavigate = 
        (direction === 'next' && navigation.canNavigateNext) ||
        (direction === 'previous' && navigation.canNavigatePrevious)

      if( shouldNavigate ) {
        handleFinishEditingAndNavigate(event, direction);
      }
      return;
    }

    if (pressedKey === 'Enter' && isEditing) {
      // Allow line break with Shift+Enter
      if (event.shiftKey) return;

      // Create new paragraph at end of chapter
      if (navigation.isTheLastParagraphInChapter) {
        event.preventDefault();
        handleFinishEditing();
        onCreateNewParagraph && onCreateNewParagraph(null);
        return;
      }

      // Create new paragraph in between with Ctrl+Enter
      if (event.ctrlKey) {
        event.preventDefault();
        handleFinishEditing();
        onCreateNewParagraph && onCreateNewParagraph(paragraph.index + 1);
        return;
      }

      handleFinishEditingAndNavigate(event, 'next');
    }

    const currentText = paragraphRef.current?.textContent?.trim() || '';

    // Finish editing on Escape
    if (pressedKey === 'Escape' && currentText !== '') {
      event.preventDefault();
      handleFinishEditing();
      return;
    }

    // Delete paragraph on Escape if it's empty
    if (['Backspace', 'Escape'].includes(pressedKey) && currentText === '') {
      event.preventDefault();

      if( pressedKey === 'Backspace' ) {
        const direction = navigation.canNavigatePrevious ? 'previous' : null;
        handleFinishEditingAndNavigate(event, direction);
      }

      handleDeleteAction();
      return;
    }
  }, [
    isCursorAtFirstPosition, 
    isCursorAtLastPosition, 
    navigation.canNavigateNext, 
    navigation.canNavigatePrevious,
    handleFinishEditingAndNavigate 
  ]);

  const handleCursorPositionUpdate = useCallback(() => {
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing]);

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

  useEffect(() => {    
    if (!focusActivation) return;

    setIsEditing(true);
    if (!paragraphRef.current) return
    paragraphRef.current.focus();

    // Scroll to ensure the element is visible in the center
    paragraphRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });

    const currentText = paragraphRef.current.textContent?.trim() || '';
    if(currentText === EMPTY_TEXT_PLACEHOLDER) {
      paragraphRef.current.textContent = '';
    }

    if (focusActivation.direction === 'previous') {
      setCursorAt(paragraphRef, 'END');
    } else {
      setCursorAt(paragraphRef, 'START');
    }
  }, [focusActivation]);


  // Toggles Buttons ------------------------------

  useEffect(  () => {
    triggerLocalSave(true);
  }, [isQuote, isHighlighted]);

  const toggleQuote = useCallback(() => {
      setIsQuote(prev => !prev);
  }, []);
  
  const toggleHighlight = useCallback(() => {
    setIsHighlighted(prev => !prev);
  }, []);

  const handleDeleteAction = useCallback(() => {
    if (!onDelete) return;
    let text = paragraphRef.current?.textContent?.trim() || '';
    if (text === EMPTY_TEXT_PLACEHOLDER) text = '';
    const result = handleDeleteQuestion(text, 'parágrafo');
    if(!result) return;
    onDelete();
    deleteParagraph(paragraph.id);
  }, [onDelete]);
  
  const buttons_actions = [
    { label: '"',description: 'Toggle Quote', action: toggleQuote, style: 'text-5xl text-gray-500' },
    { label: '★',description: 'Toggle Highlight', action: toggleHighlight, style: 'text-lg text-yellow-500' },
    { label: 'X',description: 'Delete Paragraph', action: handleDeleteAction, style: 'text-2xs text-red-400 font-bold' },
  ];
  // --------------------------------------

  return (
    <>
      <button 
        onClick={onCreateNewParagraphAbove}
        aria-label="Add Paragraph Here" 
        className={pStyle.createNewParagraphAboveStyle}>
      +
      </button>
      <div className={pStyle.mainContainerStyle}>
        {/* Botões laterais à esquerda, fora do fluxo do texto */}
        <div
          className={pStyle.toggleButtonsStyle(isEditing)}
        >
          {buttons_actions.map(({ label, description, action, style }) => (
            <button
              key={label}
              tabIndex={-1}
              aria-label={description}
              className={pStyle.toggleButtonStyle(isEditing, style)}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Parágrafo editável */}
        <div className={pStyle.paragraphContainerStyle(isEditing, isHighlighted)}>  
          {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
            <span className={pStyle.isCursorAtFirstPositionStyle}>▲</span>
          )}

          {isQuote && (
            <div className={pStyle.isQuoteStyle} aria-hidden="true">
              “
            </div>
          )}

          <div
            ref={paragraphRef}
            contentEditable
            suppressContentEditableWarning
            onClick={handleParagraphClick}
            onContextMenu={handleRightClick}
            onBlur={handleFinishEditing}
            onInput={scheduleLocalAutoSave}
            onKeyDown={handleKeyDown}
            className={pStyle.paragraphStyle(isEditing, characterCount, isQuote)}
          ></div>

          <span className={pStyle.characterCountStyle(isEditing)}>
            {characterCount} chars • {wordCount} words - index {paragraph.index + 1}
          </span>

          {isCursorAtLastPosition && navigation.canNavigateNext && (
            <span className={pStyle.isCursorAtLastPositionStyle}>▼</span>
          )}
        
          <div className={pStyle.SyncIndicatorStyle}>
            <SyncIndicator isSynced={paragraph.sync} />
          </div>
        </div>
      </div>
    </>
  );
}
