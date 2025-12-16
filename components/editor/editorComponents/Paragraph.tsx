'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick, updateCursorPosition } from '@/components/editor/utils/utils';

export interface ParagraphDataInterface {
  text: string;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  onChange: (updatedText: ParagraphDataInterface) => void;
  onRemoteSync: () => void;
  setActiveParagraph: (toUp: boolean | null) => void;
  isTheFirstParagraph: boolean;
  isTheLastParagraph: boolean;
  isActive: boolean;
  activeFrom: boolean | null | undefined;
  isOnline?: boolean;
}

export function Paragraph({
  paragraph,
  isTheFirstParagraph,
  isTheLastParagraph,
  activeFrom,
  isActive = false,
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

  const _updateCursorPosition = useCallback(() => {
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing]);

  const setCursorAt = (position: 'START' | 'END') => {
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(paragraphRef.current!);
      range.collapse(position === 'START');
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, 0);
  }

  useEffect(() => {
    if (isActive && (typeof activeFrom === 'boolean')) {
      setIsEditing(true);
      paragraphRef.current?.focus();

      // Scroll para garantir que o elemento fique visível no centro
      paragraphRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });

      if (activeFrom) setCursorAt('END');
      else setCursorAt('START');
    }
  }, [isActive, activeFrom]);

  useEffect(() => {
    if (!isEditing) return;

    const element = paragraphRef.current;
    if( !element ) return;
    
    // Eventos que indicam mudança de posição do cursor
    element.addEventListener('keyup', _updateCursorPosition);
    element.addEventListener('mouseup', _updateCursorPosition);
    element.addEventListener('focus', _updateCursorPosition);

    return () => {
      element.removeEventListener('keyup', _updateCursorPosition);
      element.removeEventListener('mouseup', _updateCursorPosition);
      element.removeEventListener('focus', _updateCursorPosition);
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

    if (e.key === 'Tab' && isEditing && !isTheLastParagraph) {
      e.preventDefault();
      handleFinishEditing();
      setActiveParagraph(false);
      // const selection = window.getSelection();
      // const range = selection?.getRangeAt(0);
      // if (range) {
      //   range.deleteContents();
      //   const tabNode = document.createTextNode('');
      //   range.insertNode(tabNode);
        
      //   // Move o cursor após o tab
      //   range.setStartAfter(tabNode);
      //   range.setEndAfter(tabNode);
      //   selection?.removeAllRanges();
      //   selection?.addRange(range);
    }

    if(['ArrowUp', 'ArrowDown'].includes(e.key)) {
      
      if( e.key === 'ArrowUp' && !isTheFirstParagraph && isCursorAtFirstPosition ) {
        e.preventDefault();
        handleFinishEditing();
        setActiveParagraph(true);
        return;
      }

      if( e.key === 'ArrowDown' && !isTheLastParagraph && isCursorAtLastPosition ) {
        e.preventDefault();
        handleFinishEditing();
        setActiveParagraph(false);
        return;
      }
    }

    if (!['Enter', 'Escape'].includes(e.key)) return
    e.preventDefault();
    handleFinishEditing();

  }, [handleFinishEditing, isCursorAtFirstPosition, isCursorAtLastPosition, paragraph.id, setActiveParagraph, isEditing]);

  const handleOnBlur = useCallback(() => {
    handleFinishEditing();
    setActiveParagraph(null);
  }, [handleFinishEditing]);

  return (
    <div className={`${isEditing ? 'bg-slate-200 shadow-sm':''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      
      {!isTheFirstParagraph && isCursorAtFirstPosition && (
        <span className="absolute left-0 top-0 text-gray-400 -translate-y-1/2">▲</span>
      )}

      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={(e) => handleClick(e, paragraphRef, isEditing, setIsEditing)}
        onBlur={handleOnBlur}
        onInput={debouncedInput}
        onKeyDown={handleKeyDown}
        className={`${isEditing ? 'rounded':''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
      >
        {paragraph.text}
      </div>

      {!isTheLastParagraph && isCursorAtLastPosition && (
        <span className="absolute left-0 bottom-0 text-gray-400 translate-y-1/2">▼</span>
      )}
    
      <div className="absolute top-0 right-0">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>
    </div>
  );
}
