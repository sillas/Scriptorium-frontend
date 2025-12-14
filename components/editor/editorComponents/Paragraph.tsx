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
  isTheLastParagraph: boolean;
  isOnline?: boolean;
}

export function Paragraph({
  paragraph,
  onChange,
  onRemoteSync,
  isTheLastParagraph,
  isOnline = true,
}: ParagraphProps) {

  const DEBOUNCE_DELAY_MS = 700;
  const [isEditing, setIsEditing] = useState(false);

  const previousTextRef = useRef(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [onRemoteSync, triggerLocalSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['Enter', 'Escape'].includes(e.key)) return
    e.preventDefault();
    handleFinishEditing();
  }, [handleFinishEditing]);

  return (
    <div className={`${isEditing ? 'shadow-sm' : ''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={(e) => handleClick(e, paragraphRef, isEditing, setIsEditing)}
        onBlur={handleFinishEditing}
        onInput={debouncedInput}
        onKeyDown={handleKeyDown}
        className={`${
          isEditing
            ? 'rounded px-1'
            : ''
        } cursor-text min-h-[1.5rem] outline-none text-justify`}
      >
        {paragraph.text}
      </div>

      {isTheLastParagraph && <span className="text-gray-400">[Last]</span>}
    
      <div className="absolute top-0 right-0">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>

    </div>
  );
}
