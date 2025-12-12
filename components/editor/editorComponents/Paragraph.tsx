'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { ParagraphInterface } from '@/components/editor/interfaces';

interface ParagraphProps {
  paragraph: ParagraphInterface;
  onChange?: (newText: string) => void;
  onSync?: (data: any, isNew?: boolean) => void;
  isOnline?: boolean;
}

export default function Paragraph({
  paragraph,
  onChange,
  onSync,
  isOnline = true,
}: ParagraphProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [localText, setLocalText] = useState(paragraph.text);
  const paragraphRef = useRef<HTMLDivElement>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger sync after changes
  const triggerSync = useCallback(() => {
    if (onSync && paragraph.id && paragraph.chapterId && paragraph.documentId) {
      const data = {
        id: paragraph.id,
        documentId: paragraph.documentId,
        chapterId: paragraph.chapterId,
        text: localText,
        updatedAt: new Date(),
        metadata: {
          characterCount: localText.length,
        },
      };
      
      onSync(data, false);
      setIsSynced(true);
    }
  }, [onSync, paragraph.id, paragraph.chapterId, paragraph.documentId, localText]);

  // Debounced sync on input
  const debouncedSync = useCallback(() => {
    setIsSynced(false);
    
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    
    syncTimerRef.current = setTimeout(() => {
      triggerSync();
    }, 500); // Sync after 500ms of no changes
  }, [triggerSync]);

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
        if (onChange) {
          onChange(newText);
        }
        triggerSync(); // Sync immediately on blur
      }
    }
  };

  const handleInput = () => {
    if (paragraphRef.current) {
      const newText = paragraphRef.current.textContent || '';
      setLocalText(newText);
      debouncedSync();
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
      {isEditing && (
        <div className="absolute top-1 right-2">
          <SyncIndicator isSynced={isSynced} isOnline={isOnline} />
        </div>
      )}
    </div>
  );
}
