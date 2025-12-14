'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ParagraphInterface } from '@/components/editor/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';

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
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSyncTimer = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearSyncTimer();
  }, []);

  const triggerLocalSave = useCallback(() => {
    if (!paragraphRef.current) return;

    const newText = paragraphRef.current?.textContent || '';
    if (newText === paragraph.text) return;

    const data: ParagraphDataInterface = {
      text: newText,
      updatedAt: new Date(),
    };

    onChange(data);
  }, [onChange]);


  const debouncedInput = useCallback(() => {    
    clearSyncTimer();
    syncTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [triggerLocalSave]);


  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => paragraphRef.current?.focus(), DEBOUNCE_DELAY_MS);
  };

  const handleBlur = () => {
    setIsEditing(false);
    triggerLocalSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['Enter', 'Escape'].includes(e.key)) return
    e.preventDefault();
    setIsEditing(false);
    paragraphRef.current?.blur();
  };

  return (
    <div className={`${isEditing ? 'shadow-sm' : ''} rounded-md p-3 mb-2 text-slate-800 relative group`}>
      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onInput={debouncedInput}
        onKeyDown={handleKeyDown}
        className={`${
          isEditing
            ? 'rounded px-1'
            : 'cursor-pointer'
        } min-h-[1.5rem] outline-none`}
      >
        {paragraph.text}
      </div>
    
      <div className="absolute top-1 right-2">
        <SyncIndicator isSynced={paragraph.sync} isOnline={isOnline} />
      </div>

    </div>
  );
}
