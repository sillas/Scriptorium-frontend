'use client';

import {  useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { countWords } from '@/components/editor/utils/helpers';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { paragraphStyles as styles } from '@/components/editor/utils/paragraphStyles';
import {
  handleClick,
  setCursorAt,
  updateCursorPosition,
  getSelection,
} from '@/components/editor/utils/utils';
import { Quote } from 'lucide-react';
import { useActionButtons } from '@/hooks/editor/paragraphs/useActionButtons';

const ICON_SIZE = 20;
const ICON_COLOR = "#fff";
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
  onRemoteSync?: () => void;
  fontClass?: string;
}

export function Paragraph({
  paragraph, focusActivation, navigation, onNavigate, onDelete, onCreateNewParagraph, onReorder, onRemoteSync, fontClass = ''
}: ParagraphProps) {

  const paragraphRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef(paragraph.text);
  const [isEditing, setIsEditing] = useState(false);
  const [shouldForceLocalSave, setForceLocalSave] = useState(false);
  const [shouldForceLocalDelete, setForceLocalDelete] = useState(false);
  const [horizontalPosition, setHorizontalPosition] = useState(0);

  const [characterCount, setCharacterCount] = useState(paragraph.text?.trim().length || 0);
  const [wordCount, setWordCount] = useState(countWords(paragraph.text));
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);
  // Custom hooks
  const { saveLocalParagraph, deleteLocalParagraph } = useLocalStorage();
  const [ setDebounce, clearDebounceTimer ] = useDebounceTimer();
  const {
    isQuote,
    isHighlighted,
    textAlignment,
    selection,
    vertical_buttons_actions,
    context_buttons_actions,
    setSelection,
  } = useActionButtons(
    paragraph,
    setForceLocalSave,
    setForceLocalDelete,
  );

  // Local Storage Functions --------------
  const triggerLocalSave = useCallback( async (forceUpdate = false) => {
    await saveLocalParagraph(
      paragraphRef,
      previousTextRef,
      paragraph,
      isQuote,
      isHighlighted,
      textAlignment,
      EMPTY_TEXT_PLACEHOLDER,
      forceUpdate
    );
  }, [paragraph, isQuote, isHighlighted, textAlignment, saveLocalParagraph]);

  const scheduleLocalAutoSave = useCallback(() => {
    clearDebounceTimer();
    setDebounce(triggerLocalSave, DEBOUNCE_DELAY_MS);

    const text = paragraphRef.current?.innerText?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [clearDebounceTimer, setDebounce, triggerLocalSave]);

  const onCreateNewParagraphAbove = () => {
    onCreateNewParagraph?.(paragraph.index);
  };

  const handleFinishEditing = useCallback(async () => {
    if(selection) return;
    setIsEditing(false);
    setSelection(null);
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);

    const text = paragraphRef.current!.textContent.trim() || '';
    if (text.length === 0) paragraphRef.current!.textContent = EMPTY_TEXT_PLACEHOLDER;
    await triggerLocalSave();
    onRemoteSync?.();
    paragraphRef.current?.blur();
  }, [triggerLocalSave, isEditing, selection, onRemoteSync]);

  // Navigation ------------------------

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
  }, [isEditing, setSelection]);

  const handleParagraphClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setSelection(null);
    if (!paragraphRef.current) return;

    const text = paragraphRef.current?.textContent?.trim() || '';
    if (text === EMPTY_TEXT_PLACEHOLDER) paragraphRef.current.textContent = '';

    handleClick(event, paragraphRef, isEditing, setIsEditing);
  }, [isEditing, setSelection]);

  const handleFinishEditingAndNavigate = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
    handleFinishEditing();
    onNavigate?.(event, direction);
  }, [handleFinishEditing, onNavigate]);

  // -------------------------------------------

  const goToParagraphOnArrows = useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
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
  }, [
    navigation,
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    handleFinishEditingAndNavigate,
  ]);

  const goToParagraphOnTab = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const direction: NavigationDirection = event.shiftKey ? 'Up' : 'Down';
    const shouldNavigate =
      (direction === 'Down' && navigation.canNavigateNext) ||
      (direction === 'Up' && navigation.canNavigatePrevious)

    if (shouldNavigate) {
      handleFinishEditingAndNavigate(event, direction);
    }
    return;
  }, [navigation, handleFinishEditingAndNavigate]);

  const handleEnterKeyPress = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
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

    handleFinishEditingAndNavigate(event, 'Down');
  }, [
    navigation,
    paragraph.index,
    handleFinishEditing,
    onCreateNewParagraph,
    handleFinishEditingAndNavigate
  ]);

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

      goToParagraphOnArrows(event, direction);
      return;
    }

    // Go to previous or next paragraph on Tab
    if (pressedKey === 'Tab' && isEditing) {
      goToParagraphOnTab(event);
      return;
    }

    if (pressedKey === 'Enter' && isEditing) {
      handleEnterKeyPress(event);
      return;
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

      deleteLocalParagraph(paragraphRef, paragraph, EMPTY_TEXT_PLACEHOLDER, onDelete);
      return;
    }
  }, [
    isEditing,
    navigation,
    paragraph.index,
    handleFinishEditing,
    handleFinishEditingAndNavigate,
    deleteLocalParagraph,
    onReorder,
    onDelete,
    goToParagraphOnArrows,
    goToParagraphOnTab,
    handleEnterKeyPress
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

  // Effects --------------------------------

  // Effect to set initial content
  useEffect(() => {
    if (!paragraphRef.current) return;
    let content = paragraph.text
    if (paragraph.text.length === 0) {
      content = EMPTY_TEXT_PLACEHOLDER;
    }
    paragraphRef.current.innerHTML = content
  }, [paragraph.text]);

  // Effect to handle focus activation
  useEffect(() => {
    if (!focusActivation) return;
    if (focusActivation.direction === 'Up') {
      setCursorAt(paragraphRef, 'END');
    } else {
      setCursorAt(paragraphRef, 'START');
    }
  }, [focusActivation]);

  // Effect to trigger local save when flagged
  useEffect(() => {
    if (!shouldForceLocalSave) return;
    triggerLocalSave(true);
    setForceLocalSave(false);
  }, [shouldForceLocalSave, triggerLocalSave]);

  // Effect to trigger local delete when flagged
  useEffect(() => {
    if (!shouldForceLocalDelete) return;
    deleteLocalParagraph(paragraphRef, paragraph, EMPTY_TEXT_PLACEHOLDER, onDelete);
    setForceLocalDelete(false);
  }, [shouldForceLocalDelete, deleteLocalParagraph]);

  // Effect to trigger local save on style changes
  useEffect(() => {
      triggerLocalSave(true);
  }, [isQuote, isHighlighted, textAlignment]);

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
          className={styles.verticalButtonsStyle(isEditing)}
        >
          {vertical_buttons_actions.map(({ Icon, description, action }) => (
            <button
              key={description}
              tabIndex={-1}
              aria-label={description}
              className={styles.verticalButtonStyle(isEditing)}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              <Icon color={ICON_COLOR} size={ICON_SIZE} />
            </button>
          ))}
        </div>

        {/* Botões horizontais posicionáveis */}
        {isEditing && selection && <div className={styles.contextButtonsContainerStyle}>
          <div className={styles.contextButtonsWrapper} style={{ left: `${horizontalPosition}px` }}>
            {context_buttons_actions.map(({Icon, description, action}) => (
              <button key={description} className={styles.contextButtonStyle} onClick={action}>
                <Icon color={ICON_COLOR} size={ICON_SIZE} />
              </button>
            ))}
          </div>
        </div>}

        {/* Parágrafo editável */}
        <div className={styles.paragraphContainerStyle(isEditing, isHighlighted, fontClass)}>
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
