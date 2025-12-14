'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick } from '@/components/editor/utils';

export interface ParagraphDataInterface {
  text: string;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  onChange: (updatedText: ParagraphDataInterface) => void;
  onRemoteSync: () => void;
  isOnline?: boolean;
}

export function Paragraph({
  paragraph,
  onChange,
  onRemoteSync,
  isOnline = true,
}: ParagraphProps) {

  const DEBOUNCE_DELAY_MS = 700;
  const [isEditing, setIsEditing] = useState(false);

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

  const triggerLocalSave = useCallback((): boolean => {
    if (!paragraphRef.current) return false;

    const newText = paragraphRef.current?.textContent.trim() || '';
    onChange({
      text: newText,
      updatedAt: new Date(),
    });
    
    const currentText = paragraph.text.trim();
    if (newText === currentText) return false;
    return true;
  }, [paragraph.text, onChange]);


  const debouncedInput = useCallback(() => {    
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [triggerLocalSave, clearDebounceTimer]);


  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    if(triggerLocalSave()) onRemoteSync();
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
        } cursor-text min-h-[1.5rem] outline-none`}
      >
        {paragraph.text}
      </div>
    
      <div className="absolute top-1 right-2">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>

    </div>
  );
}
