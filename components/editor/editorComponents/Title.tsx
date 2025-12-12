'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';

export interface TitleDataInterface {
  title: string;
  subtitle: string;
  updatedAt?: Date;
}

interface TitleProps {
  title: string;
  subtitle?: string;
  chapterId?: string;
  version?: number;
  updatedAt?: Date;
  createdAt?: Date;
  isSynced: boolean;
  onSync: () => void;
  onChange: (data: TitleDataInterface, isNew?: boolean) => void;
  isOnline?: boolean;
}

export function Title({
  title,
  subtitle,
  chapterId,
  isSynced,
  onSync,
  onChange,
  isOnline = true,
  version,
  updatedAt,
  createdAt,
}: TitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMainTitle = !chapterId;

  const triggerLocalSave = useCallback(() => {

    const newTitle = titleRef.current?.textContent || localTitle;
    const newSubtitle = subtitleRef.current?.textContent || localSubtitle;

    const data: TitleDataInterface = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };

    setLocalUpdatedAt(data.updatedAt);
    onChange(data);

  }, [onChange, chapterId]);

  const triggerSync = useCallback(() => {
    triggerLocalSave();
    setTimeout(onSync, 500);
  }, [onSync, chapterId]);

  const debouncedInput = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(triggerLocalSave, 700);
  }, [ triggerLocalSave ]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setLocalUpdatedAt(updatedAt);
  }, [updatedAt]);

  // # ======================================================

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleSubtitleClick = () => {
    setIsEditingSubtitle(true);
    setTimeout(() => subtitleRef.current?.focus(), 0);
  };

  const handleTitleInput = () => {
    if (titleRef.current) {
      const newTitle = titleRef.current.textContent || '';
      setLocalTitle(newTitle);
      debouncedInput();
    }
  };

  const handleSubtitleInput = () => {
    if (subtitleRef.current) {
      const newSubtitle = subtitleRef.current.textContent || '';
      setLocalSubtitle(newSubtitle);
      debouncedInput();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      
      triggerSync();
      setIsEditingTitle(false);

      if (e.key === 'Tab' && subtitle) {
        setIsEditingSubtitle(true);
        setTimeout(() => subtitleRef.current?.focus(), 0);
      }
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      
      triggerSync();
      setIsEditingSubtitle(false);
    }
  };

  const handleTitleBlur = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    
    triggerSync();
    setIsEditingTitle(false);
  };

  const handleSubtitleBlur = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    
    triggerSync();
    setIsEditingSubtitle(false);
  };

  return (
    <div
      className={`${
        isMainTitle
          ? 'p-6 mb-6 rounded-lg'
          : 'p-4 mb-3 rounded-md'
      } bg-slate-100 ${isEditingTitle || isEditingSubtitle ? 'shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-2">
        <h1
          ref={titleRef}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onClick={handleTitleClick}
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleBlur}
          className={`${
            isMainTitle
              ? 'text-3xl font-bold text-slate-900'
              : 'text-xl font-semibold text-slate-800'
          } ${isEditingTitle ? 'rounded px-1' : 'cursor-pointer'} flex-1 outline-none`}
        >
          {title}
        </h1>
        <SyncIndicator isSynced={isSynced} isOnline={isOnline} />
      </div>
      {subtitle && (
        <div className="flex items-center gap-2">
          <h2
            ref={subtitleRef}
            contentEditable={isEditingSubtitle}
            suppressContentEditableWarning
            onClick={handleSubtitleClick}
            onInput={handleSubtitleInput}
            onKeyDown={handleSubtitleKeyDown}
            onBlur={handleSubtitleBlur}
            className={`${
              isMainTitle
                ? 'text-lg text-slate-600 mt-2'
                : 'text-sm text-slate-600 mt-1'
            } ${isEditingSubtitle ? 'rounded px-1' : 'cursor-pointer'} flex-1 outline-none`}
          >
            {subtitle}
          </h2>
        </div>
      )}
      {
        <div className="mt-2 text-xs text-slate-500">
          {version && <span>v{version}</span>}
          {createdAt && (
            <span className="ml-2">
              Created: {createdAt.toLocaleDateString()}
            </span>
          )}
          {localUpdatedAt && ( 
            <span className="ml-2">
              Updated: {localUpdatedAt.toLocaleDateString()}
            </span>
          )}
        </div>
      }
    </div>
  );
}
