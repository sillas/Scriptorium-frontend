'use client';

import { useRef, useState, useCallback, useEffect, use } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { ParagraphInterface } from '@/components/editor/interfaces';

export interface ParagraphDataInterface {
  text: string;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  onChange: (updatedText: ParagraphDataInterface) => void;
  onSync?: (data: any, isNew?: boolean) => void;
  isOnline?: boolean;
}

export function Paragraph({
  paragraph,
  onChange,
  onSync,
  isOnline = true,
}: ParagraphProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSynced, setIsSynced] = useState(paragraph.sync);
  const [localText, setLocalText] = useState(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalText(paragraph.text);
  }, []);

  const triggerLocalSave = useCallback(() => {
    const newText = paragraphRef.current?.textContent || localText;

    const data: ParagraphDataInterface = {
      text: newText,
      updatedAt: new Date(),
    };

    onChange(data);
  }, [localText, onChange]);


  // Debounced sync on input
  const debouncedInput = useCallback(() => {    
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(triggerLocalSave, 700);
  }, [triggerLocalSave]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => paragraphRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (paragraphRef.current) {
      const newText = paragraphRef.current.textContent || '';
      if (newText !== localText) {
        setLocalText(newText);
        onChange({ text: newText, updatedAt: new Date() });

        setIsSynced(true);
      }
    }
  };

  const handleInput = () => {
    if (paragraphRef.current) {
      const newText = paragraphRef.current.textContent || '';
      setLocalText(newText);
      debouncedInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      paragraphRef.current?.blur();
    }
  };

  return (
    <div className="bg-slate-50 rounded-md p-3 mb-2 shadow-sm text-slate-800 relative group">
      <div
        ref={paragraphRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`${
          isEditing
            ? 'outline outline-2 outline-blue-500 rounded px-1'
            : 'cursor-pointer'
        } min-h-[1.5rem]`}
      >
        {paragraph.text}
      </div>
    
      <div className="absolute top-1 right-2">
        <SyncIndicator isSynced={isSynced} isOnline={isOnline} />
      </div>

    </div>
  );
}
