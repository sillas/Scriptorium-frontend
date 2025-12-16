'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick, updateCursorPosition, setCursorAt } from '@/components/editor/utils/utils';

const DEBOUNCE_DELAY_MS = 700;

export type NavigationDirection = 'previous' | 'next' | null;

export interface ParagraphUpdate {
  text: string;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  activation?: {
    direction: NavigationDirection;
  } | null;
  isOnline: boolean;
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
  };
  onTextChange: (updatedText: ParagraphUpdate) => void;
  onRemoteSync: () => void;
  onNavigate: (direction: NavigationDirection) => void;
}

export function Paragraph({
  paragraph,
  activation,
  navigation,
  isOnline = true,
  onTextChange,
  onRemoteSync,
  onNavigate,
}: ParagraphProps) {
  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isCursorAtFirstPosition, setIsCursorAtFirstPosition] = useState(false);
  const [isCursorAtLastPosition, setIsCursorAtLastPosition] = useState(false);

  const handleCursorPositionUpdate = useCallback(() => {
    updateCursorPosition(
      paragraphRef,
      isEditing,
      setIsCursorAtFirstPosition,
      setIsCursorAtLastPosition
    );
  }, [isEditing]);


  useEffect(() => {
    if (activation) {
      setIsEditing(true);
      paragraphRef.current?.focus();

      // Scroll para garantir que o elemento fique visível no centro
      paragraphRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });

      if (activation.direction === 'previous') {
        setCursorAt(paragraphRef, 'END');
      } else {
        setCursorAt(paragraphRef, 'START');
      }
    }
  }, [activation]);

  useEffect(() => {
    if (!isEditing) return;

    const element = paragraphRef.current;
    if( !element ) return;
    
    // Eventos que indicam mudança de posição do cursor
    element.addEventListener('keyup', handleCursorPositionUpdate);
    element.addEventListener('mouseup', handleCursorPositionUpdate);
    element.addEventListener('focus', handleCursorPositionUpdate);

    return () => {
      element.removeEventListener('keyup', handleCursorPositionUpdate);
      element.removeEventListener('mouseup', handleCursorPositionUpdate);
      element.removeEventListener('focus', handleCursorPositionUpdate);
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
    const newText = paragraphRef.current?.textContent.trim() || '';
    if (newText === previousTextRef.current) return;

    previousTextRef.current = newText;

    onTextChange({
      text: newText,
      updatedAt: new Date(),
    });
  }, [onTextChange]);


  const scheduleAutoSave = useCallback(() => {    
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [triggerLocalSave, clearDebounceTimer]);


  const handleFinishEditing = useCallback(() => {
    
    setIsEditing(false);
    triggerLocalSave();

    if(paragraph.sync) return;
    onRemoteSync();
    paragraphRef.current?.blur();
    
    setIsCursorAtFirstPosition(false);
    setIsCursorAtLastPosition(false);
  }, [onRemoteSync, triggerLocalSave, paragraph.sync]);

  const handleFinishEditingAndNavigate = useCallback((
    e: React.KeyboardEvent<HTMLDivElement>,
    direction: NavigationDirection
  ) => {
    e.preventDefault();
    handleFinishEditing();
    onNavigate(direction);
  }, [handleFinishEditing, onNavigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {

    const key = e.key;

    // Go to next paragraph on Tab
    if (key === 'Tab' && isEditing && navigation.canNavigateNext) {
      handleFinishEditingAndNavigate(e, 'next');
      return;
    }

    // Navigate between paragraphs with ArrowUp and ArrowDown
    if(['ArrowUp', 'ArrowDown'].includes(key)) {
      
      if(key === 'ArrowUp' && isCursorAtFirstPosition && navigation.canNavigatePrevious) {
        handleFinishEditingAndNavigate(e, 'previous');
      }

      else if(isCursorAtLastPosition && navigation.canNavigateNext) {
        handleFinishEditingAndNavigate(e, 'next');
      }

      return;
    }

    // Finish editing on Enter or Escape
    if (['Enter', 'Escape'].includes(key)) {
      e.preventDefault();
      handleFinishEditing();
    }
  }, [
    handleFinishEditing, 
    isCursorAtFirstPosition, 
    isCursorAtLastPosition, 
    onNavigate,
    isEditing
  ]);

  const handleOnBlur = useCallback(() => {
    handleFinishEditing();
  }, [handleFinishEditing, onNavigate]);

  return (
    <div className={`${isEditing ? 'bg-slate-200 shadow-sm':''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      
      {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
        <span className="absolute left-0 top-0 text-gray-400 -translate-y-1/2">▲</span>
      )}

      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={(e) => handleClick(e, paragraphRef, isEditing, setIsEditing)}
        onBlur={handleOnBlur}
        onInput={scheduleAutoSave}
        onKeyDown={handleKeyDown}
        className={`${isEditing ? 'rounded':''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
      >
        {paragraph.text}
      </div>

      {isCursorAtLastPosition && navigation.canNavigateNext && (
        <span className="absolute left-0 bottom-0 text-gray-400 translate-y-1/2">▼</span>
      )}
    
      <div className="absolute top-0 right-0">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>
    </div>
  );
}
