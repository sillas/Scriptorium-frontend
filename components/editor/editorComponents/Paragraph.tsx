'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick } from '@/components/editor/utils/utils';

export interface ParagraphDataInterface {
  text: string;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  onChange: (updatedText: ParagraphDataInterface) => void;
  onRemoteSync: () => void;
  setActiveParagraph: (CurrentParagraphId: string, toUp: boolean) => void;
  isTheFirstParagraph: boolean;
  isTheLastParagraph: boolean;
  isOnline?: boolean;
}

export function Paragraph({
  paragraph,
  isTheFirstParagraph,
  isTheLastParagraph,
  isOnline = true,
  onChange,
  onRemoteSync,
  setActiveParagraph,
}: ParagraphProps) {

  const DEBOUNCE_DELAY_MS = 700;
  const [isEditing, setIsEditing] = useState(false);

  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);

  const updateCursorPosition = () => {
    if (!isEditing || !paragraphRef.current) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(paragraphRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const cursorPosition = preSelectionRange.toString().length;
    const totalLength = paragraphRef.current.textContent.length;

    setIsCursorAtFirstPosition(cursorPosition === 0);
    setIsCursorAtLastPosition(cursorPosition === totalLength);
  };

  useEffect(() => {
    if (!isEditing) return;

    const element = paragraphRef.current;
    
    // Eventos que indicam mudança de posição do cursor
    element?.addEventListener('keyup', updateCursorPosition);
    element?.addEventListener('mouseup', updateCursorPosition);
    element?.addEventListener('focus', updateCursorPosition);

    return () => {
      element?.removeEventListener('keyup', updateCursorPosition);
      element?.removeEventListener('mouseup', updateCursorPosition);
      element?.removeEventListener('focus', updateCursorPosition);
    };
  }, [isEditing]);

  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimerRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearDebounceTimer();
  }, [clearDebounceTimer]);

  const triggerLocalSave = useCallback(() => {
    if (!paragraphRef || !previousTextRef) return;

    const newText = paragraphRef.current?.textContent.trim() || '';
    if (newText === previousTextRef.current) return;

    previousTextRef.current = newText;

    onChange({
      text: newText,
      updatedAt: new Date(),
    });
  }, [onChange]);


  const debouncedInput = useCallback(() => {    
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [triggerLocalSave, clearDebounceTimer]);


  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    triggerLocalSave()
    if(paragraph.sync) return;
    onRemoteSync();
    paragraphRef.current?.blur();
    
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
  }, [onRemoteSync, triggerLocalSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {

    if(['ArrowUp', 'ArrowDown'].includes(e.key)) {
      
      if( e.key === 'ArrowUp' && !isTheFirstParagraph && isCursorAtFirstPosition ) {
        e.preventDefault();
        handleFinishEditing();
        setActiveParagraph(paragraph.id, true);
        return;
      }

      if( e.key === 'ArrowDown' && !isTheLastParagraph && isCursorAtLastPosition ) {
        e.preventDefault();
        handleFinishEditing();
        setActiveParagraph(paragraph.id, false);
        return;
      }
    }

    if (!['Enter', 'Escape'].includes(e.key)) return
    e.preventDefault();
    handleFinishEditing();

  }, [handleFinishEditing, isCursorAtFirstPosition, isCursorAtLastPosition, paragraph.id, setActiveParagraph]);

  return (
    <div className={`${isEditing ? 'shadow-sm':''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      
      {!isTheFirstParagraph && isCursorAtFirstPosition && <span className="text-gray-400">▲</span>}

      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={(e) => handleClick(e, paragraphRef, isEditing, setIsEditing)}
        onBlur={handleFinishEditing}
        onInput={debouncedInput}
        onKeyDown={handleKeyDown}
        className={`${isEditing ? 'rounded':''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
      >
        {paragraph.text}
      </div>

      {!isTheLastParagraph &&isCursorAtLastPosition && <span className="text-gray-400">▼</span>}
    
      <div className="absolute top-0 right-0">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>
    </div>
  );
}
