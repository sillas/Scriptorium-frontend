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
  onCreateNewParagraphAbove?: () => void;
  // onReorder?: (direction: 'up' | 'down') => void;
  // onRemoteSync?: () => void;
  // createNewParagraphInChapter?: () => void;
}

export function Paragraph({
  paragraph, focusActivation, navigation, onNavigate, onDelete, onCreateNewParagraphAbove
}: ParagraphProps) {

  
  // const {
  //   paragraphRef,
  //   isEditing,
  //   setIsEditing,
  //   isQuote,
  //   isHighlighted,
  //   isCursorAtFirstPosition,
  //   isCursorAtLastPosition,
  //   characterCount,
  //   wordCount,
  //   handleKeyDown,
  //   handleFinishEditing,
  //   scheduleAutoSave,
  //   handleDeleteAction,
  //   toggleQuote,
  //   toggleHighlight,
  // } = useParagraph({
  //   paragraph,
  //   focusActivation,
  //   navigation,
  //   onTextChange,
  //   onNavigate,
  //   onDelete,
  //   onReorder,
  //   onRemoteSync,
  //   createNewParagraphInChapter,
  // });
 
  const paragraphRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef(paragraph.text);
  
  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);    
  const [isEditing, setIsEditing] = useState(false);
  const [characterCount, setCharacterCount] = useState(paragraph.text?.trim().length || 0);
  const [wordCount, setWordCount] = useState(countWords(paragraph.text));
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);

  const { paragraphLocalSave, deleteParagraph } = useLocalStorage();
  
  // Custom hooks
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  // Effect to set initial content
  useEffect(() => {
    if (!paragraphRef.current) return;
    let content = paragraph.text
    if (paragraph.text.length === 0) {
      content = EMPTY_TEXT_PLACEHOLDER;
    }
    paragraphRef.current.textContent = content
  }, [paragraph.text]);
  
  // Local Storage Functions --------------

  const triggerLocalSave = useCallback(async (forceUpdate = false) => {
      let newText = paragraphRef.current?.textContent?.trim() || '';
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

    const text = paragraphRef.current?.textContent?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [clearDebounceTimer, setDebounce, triggerLocalSave]);
  
  
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

    // Go to next paragraph on Tab
    if (pressedKey === 'Tab' && isEditing && navigation.canNavigateNext) {
      handleFinishEditingAndNavigate(event, 'next');
      return;
    }

    if(['ArrowUp', 'ArrowDown'].includes(pressedKey)) {
      if(pressedKey === 'ArrowUp' && isCursorAtFirstPosition && navigation.canNavigatePrevious) {
        handleFinishEditingAndNavigate(event, 'previous');
      }
      else if(pressedKey === 'ArrowDown' && isCursorAtLastPosition && navigation.canNavigateNext) {
        handleFinishEditingAndNavigate(event, 'next');
      }
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
    const text = paragraphRef.current?.textContent || '';
    const result = handleDeleteQuestion(text, onDelete);
    if(result) deleteParagraph(paragraph.id);
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
