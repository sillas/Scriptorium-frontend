'use client';

import {  useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { paragraphStyles as styles } from '@/components/editor/utils/paragraphStyles';
import {
  updateCursorPosition,
  getSelection,
} from '@/components/editor/utils/utils';
import { Quote } from 'lucide-react';
import { useActionButtons } from '@/hooks/editor/paragraphs/useActionButtons';
import { useParagraphEditing } from '@/hooks/editor/paragraphs/useParagraphEditing';
import { useParagraphNavigation } from '@/hooks/editor/paragraphs/useParagraphNavigation';
import { useParagraphCursor } from '@/hooks/editor/paragraphs/useParagraphCursor';
import { useParagraphContent } from '@/hooks/editor/paragraphs/useParagraphContent';
import { useParagraphPersistence } from '@/hooks/editor/paragraphs/useParagraphPersistence';

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
  const [horizontalPosition, setHorizontalPosition] = useState(0);
  
  // Custom hooks
  const {
    characterCount,
    wordCount,
    updateContentMetrics,
  } = useParagraphContent({
    paragraphRef,
    initialText: paragraph.text,
  });

  // Initialize style states first before useParagraphPersistence needs them
  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);
  const [textAlignment, setTextAlignment] = useState(paragraph.textAlignment || 'text-justify');

  const {
    triggerLocalSave,
    scheduleLocalAutoSave,
    setForceLocalSave,
    setForceLocalDelete,
  } = useParagraphPersistence({
    paragraphRef,
    previousTextRef,
    paragraph,
    emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    debounceDelayMs: DEBOUNCE_DELAY_MS,
    isQuote,
    isHighlighted,
    textAlignment,
    onDelete,
    updateContentMetrics,
  });

  const {
    isQuote: _isQuote,
    isHighlighted: _isHighlighted,
    textAlignment: _textAlignment,
    selection,
    vertical_buttons_actions,
    context_buttons_actions,
    setSelection,
  } = useActionButtons(
    paragraph,
    setForceLocalSave,
    setForceLocalDelete,
  );

  // Sync action button states with local states
  useEffect(() => {
    setIsQuote(_isQuote);
  }, [_isQuote]);

  useEffect(() => {
    setIsHighlighted(_isHighlighted);
  }, [_isHighlighted]);

  useEffect(() => {
    setTextAlignment(_textAlignment);
  }, [_textAlignment]);

  const {
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    setIsCursorAtFirstPosition,
    setIsCursorAtLastPosition,
    resetCursorPosition,
  } = useParagraphCursor({
    paragraphRef,
    focusActivation,
  });

  const {
    isEditing,
    handleStartEditing,
    handleFinishEditing,
    handleParagraphClick,
  } = useParagraphEditing({
    paragraphRef,
    emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    selection,
    setSelection,
    resetCursorPosition,
    onSave: triggerLocalSave,
    onRemoteSync,
  });

  const handleCursorPositionUpdate = useCallback(() => {
    handleStartEditing();
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing, handleStartEditing, paragraphRef, setIsCursorAtFirstPosition, setIsCursorAtLastPosition]);

  const { handleKeyDown } = useParagraphNavigation({
    paragraphRef,
    paragraph,
    emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    isEditing,
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    navigation,
    handleFinishEditing,
    onNavigate,
    onCreateNewParagraph,
    onReorder,
    onDelete,
    deleteLocalParagraph: () => {
      setForceLocalDelete(true);
    },
  });

  const onCreateNewParagraphAbove = () => {
    onCreateNewParagraph?.(paragraph.index);
  };

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
