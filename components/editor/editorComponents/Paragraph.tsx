'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { countWords } from '@/components/editor/utils/helpers';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { paragraphStyles as styles } from '@/components/editor/utils/paragraphStyles';
import {
  handleClick,
  setCursorAt,
  handleRightClick,
  handleDeleteQuestion,
  updateCursorPosition
} from '@/components/editor/utils/utils';

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
  onNavigate?: (event: React.KeyboardEvent<HTMLDivElement>, direction: NavigationDirection) => void;
  onCreateNewParagraph?: (paragraphIndex: number | null) => void;
  onReorder?: (direction: NavigationDirection) => void;
  // onRemoteSync?: () => void;
}

export function Paragraph({
  paragraph, focusActivation, navigation, onNavigate, onDelete, onCreateNewParagraph, onReorder
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
    if (newText === EMPTY_TEXT_PLACEHOLDER) newText = ''

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
    if (text.length === 0) paragraphRef.current!.textContent = EMPTY_TEXT_PLACEHOLDER;
    await triggerLocalSave();
    paragraphRef.current?.blur();
  }, [triggerLocalSave, isEditing]);


  const handleParagraphClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!paragraphRef.current) return;

    const text = paragraphRef.current?.textContent?.trim() || '';
    if (text === EMPTY_TEXT_PLACEHOLDER) paragraphRef.current.textContent = '';

    handleClick(event, paragraphRef, isEditing, setIsEditing);
  }, [isEditing]);

  // Navigation ------------------------

  const handleFinishEditingAndNavigate = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
    handleFinishEditing();
    onNavigate?.(event, direction);
  }, [handleFinishEditing, onNavigate]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const pressedKey = event.key;

    // Go to previous or next paragraph on Arrow Up/Down
    if (['ArrowUp', 'ArrowDown'].includes(pressedKey)) {
      const direction = pressedKey === 'ArrowUp' ? 'Up' : 'Down';

      if (event.ctrlKey) {
        event.preventDefault();
        onReorder?.(direction);
        return;
      }

      const canNavigate = direction === 'Down'
        ? navigation.canNavigateNext
        : navigation.canNavigatePrevious;

      if (!canNavigate) return;

      // Navegar apenas se o cursor estiver na extremidade
      const isAtEdge = direction === 'Up'
        ? isCursorAtFirstPosition
        : isCursorAtLastPosition;

      if (isAtEdge) {
        event.preventDefault();
        handleFinishEditingAndNavigate(event, direction);
      }

      return;
    }

    // Go to previous or next paragraph on Tab
    if (pressedKey === 'Tab' && isEditing) {
      const direction: NavigationDirection = event.shiftKey ? 'Up' : 'Down';
      const shouldNavigate =
        (direction === 'Down' && navigation.canNavigateNext) ||
        (direction === 'Up' && navigation.canNavigatePrevious)

      if (shouldNavigate) {
        handleFinishEditingAndNavigate(event, direction);
      }
      return;
    }

    if (pressedKey === 'Enter' && isEditing) {
      // Allow line break with Shift+Enter
      if (event.shiftKey) return;

      event.preventDefault();
      // Create new paragraph at end of chapter
      if (navigation.isTheLastParagraphInChapter) {
        handleFinishEditing();
        onCreateNewParagraph && onCreateNewParagraph(null);
        return;
      }

      // Create new paragraph in between with Ctrl+Enter
      if (event.ctrlKey) {
        handleFinishEditing();
        onCreateNewParagraph && onCreateNewParagraph(paragraph.index + 1);
        return;
      }

      handleFinishEditingAndNavigate(event, 'Down');
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

      if (pressedKey === 'Backspace') {
        const direction: NavigationDirection = navigation.canNavigatePrevious ? 'Up' : null;
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

  const handleOnFocus = useCallback(() => {
    if (!paragraphRef.current) return

    if (isEditing) return;
    setIsEditing(true);
    paragraphRef.current.focus();

    // Scroll to ensure the element is visible in the center
    paragraphRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    const currentText = paragraphRef.current.textContent?.trim() || '';

    if (currentText === EMPTY_TEXT_PLACEHOLDER) {
      paragraphRef.current.textContent = '';
    }
  }, [isEditing]);

  const handleCursorPositionUpdate = useCallback(() => {
    handleOnFocus();
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing, handleOnFocus]);

  useEffect(() => {
    if (!focusActivation) return;
    if (focusActivation.direction === 'Up') {
      setCursorAt(paragraphRef, 'END');
    } else {
      setCursorAt(paragraphRef, 'START');
    }
  }, [focusActivation]);

  // Toggles Buttons ------------------------------

  useEffect(() => {
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
    if (!result) return;
    onDelete();
    deleteParagraph(paragraph.id);
  }, [onDelete]);

  const buttons_actions = [
    { label: '"', description: 'Toggle Quote', action: toggleQuote, style: 'text-5xl text-gray-500' },
    { label: '★', description: 'Toggle Highlight', action: toggleHighlight, style: 'text-lg text-yellow-500' },
    { label: 'X', description: 'Delete Paragraph', action: handleDeleteAction, style: 'text-2xs text-red-400 font-bold' },
  ];

  // --------------------------------------

  return (
    <>
      <button
        onClick={onCreateNewParagraphAbove}
        aria-label="Add Paragraph Here"
        className={styles.createNewParagraphAboveStyle}>
        +
      </button>
      <div className={styles.mainContainerStyle}>
        {/* Botões laterais à esquerda, fora do fluxo do texto */}
        <div
          className={styles.toggleButtonsStyle(isEditing)}
        >
          {buttons_actions.map(({ label, description, action, style }) => (
            <button
              key={label}
              tabIndex={-1}
              aria-label={description}
              className={styles.toggleButtonStyle(isEditing, style)}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Parágrafo editável */}
        <div className={styles.paragraphContainerStyle(isEditing, isHighlighted)}>
          {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
            <span className={styles.isCursorAtFirstPositionStyle}>▲</span>
          )}

          {isQuote && (
            <div className={styles.isQuoteStyle} aria-hidden="true">
              “
            </div>
          )}

          <div
            ref={paragraphRef}
            contentEditable
            suppressContentEditableWarning
            onClick={handleParagraphClick}
            onContextMenu={handleRightClick}
            onFocus={handleCursorPositionUpdate}
            onBlur={handleFinishEditing}
            onInput={scheduleLocalAutoSave}
            onKeyDown={handleKeyDown}
            onKeyUp={handleCursorPositionUpdate}
            className={styles.paragraphStyle(isEditing, characterCount, isQuote)}
          ></div>

          <span className={styles.characterCountStyle(isEditing)}>
            {paragraph.index + 1}° parágrafo • {characterCount} chars • {wordCount} words
          </span>

          {isCursorAtLastPosition && navigation.canNavigateNext && (
            <span className={styles.isCursorAtLastPositionStyle}>▼</span>
          )}

          <div className={styles.syncIndicatorStyle}>
            <SyncIndicator isSynced={paragraph.sync} />
          </div>
        </div>
      </div>
    </>
  );
}
