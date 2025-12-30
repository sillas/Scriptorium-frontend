'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface, textAlignmentType } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { countWords } from '@/components/editor/utils/helpers';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { paragraphStyles as styles } from '@/components/editor/utils/paragraphStyles';
import {
  handleClick,
  setCursorAt,
  handleDeleteQuestion,
  updateCursorPosition,
  getSelection,
  toggleFormattingOnSelection,
  clearFormattingOnSelection
} from '@/components/editor/utils/utils';
import { Bold, Eraser, Italic, Quote, RemoveFormatting, Star, TextAlignCenter, TextAlignEnd, TextAlignJustify, TextAlignStart, Underline } from 'lucide-react';

const DEBOUNCE_DELAY_MS = 700;
const EMPTY_TEXT_PLACEHOLDER = 'Clique para editar este parágrafo...';

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
  const [textAlignment, setTextAlignment] = useState<textAlignmentType>(paragraph.textAlignment || 'text-justify');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [horizontalPosition, setHorizontalPosition] = useState(0);

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
      textAlignment: textAlignment,
      updatedAt: new Date(),
    });
  }, [paragraph, isQuote, isHighlighted, textAlignment]);

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
    if(selection) return;
    setIsEditing(false);
    setSelection(null);
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);

    const text = paragraphRef.current!.textContent.trim() || '';
    if (text.length === 0) paragraphRef.current!.textContent = EMPTY_TEXT_PLACEHOLDER;
    await triggerLocalSave();
    paragraphRef.current?.blur();
  }, [triggerLocalSave, isEditing, selection]);


  const handleParagraphClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setSelection(null);
    if (!paragraphRef.current) return;

    const text = paragraphRef.current?.textContent?.trim() || '';
    if (text === EMPTY_TEXT_PLACEHOLDER) paragraphRef.current.textContent = '';

    handleClick(event, paragraphRef, isEditing, setIsEditing);
  }, [isEditing]);

  const handleRightClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {

    if(!isEditing) return;

    event.preventDefault();

    if( event.button !== 2 ) return;
    const curent_selection = getSelection(event);
    
    if(curent_selection) {
      // Should open popup menu on the mouse position clicked
      const max_right_position = 200;
      const targetBounds = event.currentTarget.getBoundingClientRect();
      let xRelative = event.clientX - targetBounds.left;
      if(targetBounds.width - xRelative < max_right_position) {
        xRelative = targetBounds.width - max_right_position;
      }
      setHorizontalPosition(xRelative);
      setSelection(curent_selection);
    }
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
  }, [isQuote, isHighlighted, textAlignment]);

  const setTextCenter = useCallback(() => {
    setTextAlignment('text-center');
  }, []);

  const setTextLeft = useCallback(() => {
    setTextAlignment('text-left');
  }, []);

  const setTextRight = useCallback(() => {
    setTextAlignment('text-right');
  }, []);

  const setTextJustify = useCallback(() => {
    setTextAlignment('text-justify');
  }, []);

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

  // --------------------------------------

  const handleTextBold = useCallback(() => {
    if (!selection) return;
    toggleFormattingOnSelection(selection, 'strong');
    setSelection(null);
  }, [selection]);

  const handleTextUnderline = useCallback(() => {
    if (!selection) return;
    toggleFormattingOnSelection(selection, 'u');
    setSelection(null);
  }, [selection]);

  const handleTextItalic = useCallback(() => {
    if (!selection) return;
    toggleFormattingOnSelection(selection, 'i');
    setSelection(null);
  }, [selection]);

  const handleClearFormatting = useCallback(() => {
    if (!selection) return;
    clearFormattingOnSelection(selection);
    setSelection(null);
  }, [selection]);

  const ICON_SIZE = 20;
  const ICON_COLOR = "#fff";
  const vertical_buttons_actions = [
    { icon: <TextAlignCenter color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Text Center', action: setTextCenter },
    { icon: <TextAlignEnd color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Text Right', action: setTextRight },
    { icon: <TextAlignStart color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Text Left', action: setTextLeft },
    { icon: <TextAlignJustify color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Text Justify', action: setTextJustify },
    { icon: <Quote color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Quote', action: toggleQuote },
    { icon: <Star color={ICON_COLOR} size={ICON_SIZE} />, description: 'Toggle Highlight', action: toggleHighlight },
    { icon: <Eraser color={ICON_COLOR} size={ICON_SIZE} />, description: 'Delete Paragraph', action: handleDeleteAction },
  ];

  const context_buttons_actions = [
    { icon: <Bold color={ICON_COLOR} size={ICON_SIZE} />, description: 'Set Text Bold', action: handleTextBold},
    { icon: <Italic color={ICON_COLOR} size={ICON_SIZE} />, description: 'Set Text Italic', action: handleTextItalic},
    { icon: <Underline color={ICON_COLOR} size={ICON_SIZE} />, description: 'Set Text Underline', action: handleTextUnderline},
    { icon: <RemoveFormatting color={ICON_COLOR} size={ICON_SIZE} />, description: 'Clear Text Formatting', action: handleClearFormatting},
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
          {vertical_buttons_actions.map(({ icon, description, action }) => (
            <button
              key={description}
              tabIndex={-1}
              aria-label={description}
              className={styles.toggleButtonStyle(isEditing)}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Botões horizontais posicionáveis */}
        {isEditing && selection && <div className="absolute top-[-1.9rem] w-full h-[30px] select-none">
        <div className="absolute bg-slate-800 focus:outline-none flex gap-[5px] p-1" style={{ left: `${horizontalPosition}px` }}>
            {context_buttons_actions.map(({icon, description, action}) => (
              <button key={description} className={styles.contextButtonStyle} onClick={action}>
                {icon}
              </button>
            ))}
          </div>
        </div>}

        {/* Parágrafo editável */}
        <div className={styles.paragraphContainerStyle(isEditing, isHighlighted)}>
          {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
            <span className={styles.isCursorAtFirstPositionStyle}>▲</span>
          )}

          {isQuote && (
            <div className={styles.isQuoteStyle} aria-hidden="true">
              <Quote size={15} color="#4a5565" strokeWidth={2} />
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
            className={styles.paragraphStyle(
              isEditing, 
              characterCount, 
              isQuote, 
              textAlignment
            )}
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
