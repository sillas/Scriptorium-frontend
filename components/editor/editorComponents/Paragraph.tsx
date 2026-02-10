'use client';

import { RefObject, useCallback, useEffect, useRef, useState, memo } from 'react';
import { Quote } from 'lucide-react';
import { PARAGRAPH_CONFIG } from '@/lib/editor/constants';
import { useActionButtons } from '@/hooks/editor/paragraphs/useActionButtons';
import { useParagraphEditing } from '@/hooks/editor/paragraphs/useParagraphEditing';
import { useParagraphNavigation } from '@/hooks/editor/paragraphs/useParagraphNavigation';
import { useParagraphCursor } from '@/hooks/editor/paragraphs/useParagraphCursor';
import { useParagraphContent, ContentMetrics } from '@/hooks/editor/paragraphs/useParagraphContent';
import { useParagraphPersistence } from '@/hooks/editor/paragraphs/useParagraphPersistence';
import { useParagraphContextMenu } from '@/hooks/editor/paragraphs/useParagraphContextMenu';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/types';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { styles } from '@/components/editor/styles/paragraph';
import ParagraphIndicators, { ParagraphIndicatorsHandle } from '@/components/editor/editorComponents/ParagraphIndicators';

const {
  ICON_SIZE, ICON_COLOR,
  DEBOUNCE_DELAY_MS, EMPTY_TEXT_PLACEHOLDER
} = PARAGRAPH_CONFIG;

interface ParagraphProps {
  isNavigatingRef: RefObject<boolean>;
  focusActivation?: { direction: NavigationDirection } | null;
  onDelete?: () => void;
  onNavigate?: (event: React.KeyboardEvent<HTMLDivElement>, direction: NavigationDirection) => void;
  onCreateNewParagraph?: (paragraphIndex: number | null) => void;
  onReorder?: (paragraphId: string, direction: NavigationDirection) => void;
  onRemoteSync?: () => void;
  onRemoteSyncNow?: () => void;
  fontClass?: string;
}

function ParagraphComponent({
  paragraph, focusActivation, isNavigatingRef, navigation,
  onNavigate, onDelete, onCreateNewParagraph, onReorder, onRemoteSync, onRemoteSyncNow,
  fontClass = ''
}: ParagraphProps & { 
  paragraph: ParagraphInterface, 
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    isTheLastParagraphInChapter: boolean;
  }
}) {

  console.log('------ RERENDER!!!');
  

  const paragraphRef = useRef<HTMLDivElement>(null);
  const indicatorsRef = useRef<ParagraphIndicatorsHandle>(null);
  const metricsRef = useRef<ContentMetrics | null>(null);
  const firstArrowRef = useRef<HTMLSpanElement>(null);
  const lastArrowRef = useRef<HTMLSpanElement>(null);
  const [isSynced, setIsSynced] = useState(paragraph.sync);
  const [shouldForceLocalSave, setForceLocalSave] = useState(false);
  const [shouldForceLocalDelete, setForceLocalDelete] = useState(false);
  
  // ============ Hooks Customizados ============
  
  // Content Management
  const handleMetricsChange = useCallback((metrics: ContentMetrics) => {
    metricsRef.current = metrics;
    indicatorsRef.current?.setMetrics(metrics);
  }, []);

  const { initialMetrics, updateContentMetrics } = useParagraphContent({
    paragraphRef,
    initialText: paragraph.text,
    onMetricsChange: handleMetricsChange,
  });

  if (!metricsRef.current) {
    metricsRef.current = initialMetrics;
  }

  useEffect(() => {
    metricsRef.current = initialMetrics;
    indicatorsRef.current?.setMetrics(initialMetrics);
  }, [initialMetrics]);

  const refreshCursorUI = useCallback((params: {
    position: number;
    totalLength: number;
    isAtFirst: boolean;
    isAtLast: boolean;
  }) => {
    indicatorsRef.current?.setCursorPosition(params.position);

    const shouldShowFirst = params.isAtFirst && navigation.canNavigatePrevious;
    const shouldShowLast = params.isAtLast && navigation.canNavigateNext;

    if (firstArrowRef.current) {
      firstArrowRef.current.classList.toggle('hidden', !shouldShowFirst);
    }
    if (lastArrowRef.current) {
      lastArrowRef.current.classList.toggle('hidden', !shouldShowLast);
    }
  }, [navigation.canNavigatePrevious, navigation.canNavigateNext]);

  // Action Buttons (formatting, styles, delete)
  const {
    selection, verticalButtonsActions, contextButtonsActions,
    isQuote, isHighlighted, textAlignment, setSelection, setTextAlignment
  } = useActionButtons(
    paragraph, setForceLocalSave, setForceLocalDelete
  );

  // Persistence
  const { 
    triggerLocalSave, scheduleLocalAutoSave,
  } = useParagraphPersistence({
    paragraphRef, paragraph,
    emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    debounceDelayMs: DEBOUNCE_DELAY_MS,
    isQuote, isHighlighted, textAlignment,
    shouldForceLocalSave, shouldForceLocalDelete,
    onDelete, updateContentMetrics, 
    setIsSynced, 
    setForceLocalSave, setForceLocalDelete
  });
  
  // Ctrl + S -> Fast Finish Editing
  const handleFastFinishEditing = useCallback(() => { 
    triggerLocalSave();
    onRemoteSyncNow?.();
  }, [onRemoteSyncNow]);

  // Cursor Position Tracking
  const {
    isCursorAtFirstPositionRef, isCursorAtLastPositionRef,
    resetCursorPosition, setCursorPosition
  } = useParagraphCursor({ paragraphRef, focusActivation });

  // Editing State & Transitions
  const {
    isEditing, 
    handleStartEditing, handleFinishEditing, handleParagraphClick,
  } = useParagraphEditing({
    paragraphRef, selection, emptyTextPlaceholder: EMPTY_TEXT_PLACEHOLDER,
    setSelection, onRemoteSync, resetCursorPosition, onSave: triggerLocalSave,
  });

  // Context Menu (right-click)
  const { 
    horizontalPosition, handleRightClick
  } = useParagraphContextMenu({ isEditing, setSelection });

  // Keyboard Navigation
  const { handleKeyDown, handleScrolling } = useParagraphNavigation({
    paragraphRef, isNavigatingRef, paragraph, isEditing,
    isCursorAtFirstPositionRef, isCursorAtLastPositionRef,
    navigation, triggerLocalSave,
    handleFinishEditing, handleFastFinishEditing,
    onCreateNewParagraph,
    onNavigate, onReorder, setForceLocalDelete,
    setCursorPosition: (cb) => setCursorPosition(cb ?? refreshCursorUI),
    setTextAlignment
  });

  // ============ Helper Functions ============
  const handleCursorPositionUpdate = useCallback((event: React.FocusEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (event.type === 'focus') handleStartEditing();
    setCursorPosition(refreshCursorUI);
  }, [
    handleStartEditing,
    setCursorPosition,
    refreshCursorUI
  ]);

  const paragraphOnClick = (event: React.MouseEvent<HTMLDivElement>) => {
    handleParagraphClick(event); 
    setCursorPosition(refreshCursorUI);
  }

  const onCreateNewParagraphAbove = () => onCreateNewParagraph?.(paragraph.index);

  // ============ Effects ============

  // Initialize paragraph content on mount
  useEffect(() => {
    if (!paragraphRef.current) return;
    const content = paragraph.text.length === 0 ? EMPTY_TEXT_PLACEHOLDER : paragraph.text;
    paragraphRef.current.innerHTML = content;
  }, [paragraph.text]);

  useEffect(() => {
    setIsSynced(paragraph.sync);
  }, [paragraph]);

  // ============ Render ============

  const currentMetrics = metricsRef.current ?? initialMetrics;

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
          <span
            ref={firstArrowRef}
            className={`${styles.isCursorAtFirstPositionStyle} hidden`}
            aria-hidden="true"
          >
            ▲
          </span>

          {isQuote && (
            <div className={styles.isQuoteStyle} aria-hidden="true">
              <Quote size={15} color="#4a5565" strokeWidth={2} />
            </div>
          )}

          <p
            ref={paragraphRef}
            contentEditable
            suppressContentEditableWarning
            onClick={paragraphOnClick}
            onContextMenu={handleRightClick}
            onBlur={handleFinishEditing}
            onInput={scheduleLocalAutoSave}
            onKeyDown={handleKeyDown}
            onFocus={handleCursorPositionUpdate}
            onKeyUp={handleCursorPositionUpdate}
            className={styles.paragraphStyle(
              isEditing, 
              currentMetrics.characterCount, 
              isQuote, 
              textAlignment
            )}
          ></p>

          <ParagraphIndicators
            ref={indicatorsRef}
            paragraphIndex={paragraph.index}
            isEditing={isEditing}
            initialMetrics={initialMetrics}
          />

          <span
            ref={lastArrowRef}
            className={`${styles.isCursorAtLastPositionStyle} hidden`}
            aria-hidden="true"
          >
            ▼
          </span>

          <div className={styles.syncIndicatorStyle}>
            <SyncIndicator isSynced={isSynced} />
          </div>
        </div>
      </div>
    </>
  );
}

// Memoização com comparação customizada para evitar re-renders desnecessários
const Paragraph = memo(ParagraphComponent, (prevProps, nextProps) => {
  // Re-renderizar apenas se o parágrafo específico ou suas props de controle mudarem
  return (
    prevProps.paragraph.id === nextProps.paragraph.id &&
    prevProps.paragraph.index === nextProps.paragraph.index &&
    prevProps.paragraph.text === nextProps.paragraph.text &&
    prevProps.paragraph.sync === nextProps.paragraph.sync &&
    prevProps.paragraph.isQuote === nextProps.paragraph.isQuote &&
    prevProps.paragraph.isHighlighted === nextProps.paragraph.isHighlighted &&
    prevProps.paragraph.textAlignment === nextProps.paragraph.textAlignment &&
    prevProps.focusActivation === nextProps.focusActivation &&
    prevProps.navigation.canNavigatePrevious === nextProps.navigation.canNavigatePrevious &&
    prevProps.navigation.canNavigateNext === nextProps.navigation.canNavigateNext &&
    prevProps.fontClass === nextProps.fontClass
  );
});

Paragraph.displayName = 'Paragraph';

// Renderizar parágrafos sem memoização para garantir re-render na reordenação
export const ParagraphList = ({ 
    paragraphs,
    ...rest
}: ParagraphProps & { paragraphs: ParagraphInterface[] }) => {
    return (
        <>
            {paragraphs.map(paragraph => (
                <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    {...rest}
                    navigation={{
                        canNavigatePrevious: paragraph.index > 0,
                        canNavigateNext: paragraph.index < paragraphs.length -1,
                        isTheLastParagraphInChapter: false
                    }}
                />
            ))}
        </>
    );
};
ParagraphList.displayName = 'ParagraphList';
