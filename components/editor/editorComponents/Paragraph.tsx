'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Quote } from 'lucide-react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/types';
import { styles } from '@/components/editor/styles/paragraph';
import { updateCursorPosition } from '@/lib/editor/selection';
import { useActionButtons } from '@/hooks/editor/paragraphs/useActionButtons';
import { useParagraphEditing } from '@/hooks/editor/paragraphs/useParagraphEditing';
import { useParagraphNavigation } from '@/hooks/editor/paragraphs/useParagraphNavigation';
import { useParagraphCursor } from '@/hooks/editor/paragraphs/useParagraphCursor';
import { useParagraphContent } from '@/hooks/editor/paragraphs/useParagraphContent';
import { useParagraphPersistence } from '@/hooks/editor/paragraphs/useParagraphPersistence';
import { useParagraphContextMenu } from '@/hooks/editor/paragraphs/useParagraphContextMenu';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { PARAGRAPH_CONFIG } from '@/lib/editor/constants';

const { 
  ICON_SIZE, ICON_COLOR, 
  DEBOUNCE_DELAY_MS, EMPTY_TEXT_PLACEHOLDER
} = PARAGRAPH_CONFIG;

type FocusOrKeyboardEventType = React.FocusEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>;

interface ParagraphProps {
  paragraph: ParagraphInterface;
  isNavigatingRef: RefObject<boolean>;
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
  paragraph, focusActivation, isNavigatingRef, navigation, 
  onNavigate, onDelete, onCreateNewParagraph, onReorder, onRemoteSync,
  fontClass = ''
}: ParagraphProps) {

  const paragraphRef = useRef<HTMLDivElement>(null);
  const [isSynced, setIsSynced] = useState(paragraph.sync);
  const [shouldForceLocalSave, setForceLocalSave] = useState(false);
  const [shouldForceLocalDelete, setForceLocalDelete] = useState(false);
  
  // ============ Hooks Customizados ============
  
  // 1. Content Management
  const { 
    characterCount, wordCount, updateContentMetrics
  } = useParagraphContent({
    paragraphRef, initialText: paragraph.text,
  });

  // 2. Action Buttons (formatting, styles, delete)
  const {
    selection, verticalButtonsActions, contextButtonsActions,
    isQuote, isHighlighted, textAlignment, setSelection,
  } = useActionButtons(
    paragraph, setForceLocalSave, setForceLocalDelete
  );

  // 3. Persistence
  const { 
    triggerLocalSave, scheduleLocalAutoSave,
  } = useParagraphPersistence({
    paragraphRef, paragraph,
    emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    debounceDelayMs: DEBOUNCE_DELAY_MS,
    isQuote, isHighlighted, textAlignment, 
    shouldForceLocalSave, shouldForceLocalDelete,
    onDelete, updateContentMetrics, 
    setIsSynced, setForceLocalSave, setForceLocalDelete
  });

  // 5. Cursor Position Tracking
  const {
    isCursorAtFirstPosition, isCursorAtLastPosition,
    setIsCursorAtFirstPosition, setIsCursorAtLastPosition,
    resetCursorPosition,
  } = useParagraphCursor({ paragraphRef, focusActivation });

  // 6. Editing State & Transitions
  const {
    isEditing, 
    handleStartEditing, handleFinishEditing, handleParagraphClick,
  } = useParagraphEditing({
    paragraphRef, selection, emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    setSelection, onRemoteSync, resetCursorPosition, onSave: triggerLocalSave,
  });

  // 7. Context Menu (right-click)
  const { 
    horizontalPosition, handleRightClick
  } = useParagraphContextMenu({ isEditing, setSelection });

  // 8. Keyboard Navigation
  const { handleKeyDown } = useParagraphNavigation({
    paragraphRef, isNavigatingRef, paragraph, isEditing,
    isCursorAtFirstPosition, isCursorAtLastPosition,
    navigation, emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    handleFinishEditing, onNavigate,
    onCreateNewParagraph,
    onReorder, setForceLocalDelete,
  });

  // ============ Helper Functions ============
  const handleCursorPositionUpdate = useCallback((event: FocusOrKeyboardEventType) => {
    handleStartEditing();
    updateCursorPosition(
      paragraphRef, isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [
    isEditing, paragraphRef, 
    handleStartEditing, 
    setIsCursorAtFirstPosition, setIsCursorAtLastPosition
  ]);

  const onCreateNewParagraphAbove = () => onCreateNewParagraph?.(paragraph.index);

  const handleScrolling = useCallback(() => {
    if(!isNavigatingRef.current) return;
    isNavigatingRef.current = false;
    
    // Scroll to ensure the element is visible in the center
    paragraphRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    
  }, []);

  // ============ Effects ============

  // Initialize paragraph content on mount
  useEffect(() => {
    if (!paragraphRef.current) return;
    const content = paragraph.text.length === 0 ? EMPTY_TEXT_PLACEHOLDER : paragraph.text;
    paragraphRef.current.innerHTML = content;
  }, [paragraph.text]);

  useEffect(() => {
    setIsSynced(paragraph.sync);
  }, [paragraph.sync]);

  // ============ Render ============

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
          {verticalButtonsActions.map(({ Icon, description, action }) => (
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
            {contextButtonsActions.map(({Icon, description, action}) => (
              <button key={description} className={styles.contextButtonStyle} onClick={action}>
                <Icon color={ICON_COLOR} size={ICON_SIZE} />
              </button>
            ))}
          </div>
        </div>}

        {/* Parágrafo editável */}
        <div
          onFocus={handleScrolling} 
          className={styles.paragraphContainerStyle(isEditing, isHighlighted, fontClass)}>
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
            onBlur={handleFinishEditing}
            onInput={scheduleLocalAutoSave}
            onKeyDown={handleKeyDown}
            onFocus={handleCursorPositionUpdate}
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
            <SyncIndicator isSynced={isSynced} />
          </div>
        </div>
      </div>
    </>
  );
}
