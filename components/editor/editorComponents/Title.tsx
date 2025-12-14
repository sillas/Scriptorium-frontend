'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';

export interface UpdatedTitleInterface {
  title: string;
  subtitle: string;
  updatedAt?: Date;
}

interface TitleProps {
  title: string;
  subtitle?: string;
  version?: number;
  updatedAt?: Date;
  createdAt?: Date;
  isSynced: boolean;
  isDocumentTitle: boolean;
  onRemoteSync: () => void;
  onChange: (data: UpdatedTitleInterface, isNew?: boolean) => void;
  isOnline?: boolean;
}

interface TitleMetadataInterface {
  version?: number;
  createdAt?: Date;
  localUpdatedAt?: Date;
}

const TitleMetadata = ({version, createdAt, localUpdatedAt}:TitleMetadataInterface) => (
  <div className="mt-2 text-xs text-slate-500">
    {version !== undefined && <span>v{version}</span>}
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
  </div>);

export function Title({
  title,
  subtitle,
  isSynced,
  version,
  updatedAt,
  createdAt,
  isDocumentTitle,
  onRemoteSync,
  onChange,
  isOnline = true,
}: TitleProps) {
  const DEBOUNCE_DELAY_MS = 700;
  const FOCUS_DELAY_MS = 700;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);

  // Track local updateAt to show in metadata,
  // as props' updateAt only changes on remote sync,
  // never on local edits.
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSyncTimer = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }


  useEffect(() => {
    return () => clearSyncTimer()
  }, []);


  useEffect(() => {
    setLocalUpdatedAt(updatedAt);
  }, [updatedAt]);


  const triggerLocalSave = useCallback(() => {

    const newTitle = titleRef.current?.textContent || '';
    const newSubtitle = subtitleRef.current?.textContent || '';

    const data: UpdatedTitleInterface = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };

    setLocalUpdatedAt(data.updatedAt);
    onChange(data);

  }, [onChange]);


  const triggerSync = useCallback(() => {
    triggerLocalSave();
    setTimeout(onRemoteSync, FOCUS_DELAY_MS);
  }, [onRemoteSync, triggerLocalSave]);


  const debouncedInput = useCallback(() => {
    clearSyncTimer();
    syncTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [ triggerLocalSave ]);


  const stopEditingAndTriggerSync = () => {
    clearSyncTimer();
    triggerSync();
  }

  const shouldStopEditing = (key: string) => ['Tab', 'Enter', 'Escape'].includes(key);


  const handleClick = (itemRef: React.RefObject<HTMLHeadingElement | null>, setEditing: React.Dispatch<React.SetStateAction<boolean>>) => {
    setEditing(true);
    setTimeout(() => itemRef.current?.focus(), FOCUS_DELAY_MS);
  }

  const handleBlur = (setIsEditing: React.Dispatch<React.SetStateAction<boolean>>) => {
    stopEditingAndTriggerSync();
    setIsEditing(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>): boolean => {

    if (!shouldStopEditing(e.key)) return false;
    
    e.preventDefault();
    stopEditingAndTriggerSync();
    return true
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {

    if (!handleKeyDown(e)) return
    setIsEditingTitle(false);

    if (e.key === 'Tab' && subtitle) {
      setIsEditingSubtitle(true);
      setTimeout(() => subtitleRef.current?.focus(), FOCUS_DELAY_MS);
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (!handleKeyDown(e)) return
    setIsEditingSubtitle(false);
  };

  return (
    <div
      className={`${
        isDocumentTitle
          ? 'p-6 mb-6 rounded-lg'
          : 'p-4 mb-3 rounded-md'
      } bg-slate-100 ${isEditingTitle || isEditingSubtitle ? 'shadow-sm' : ''}`}
    >
      <div className="flex items-center gap-2">
        <h1
          ref={titleRef}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onClick={() => handleClick(titleRef, setIsEditingTitle)}
          onInput={debouncedInput}
          onKeyDown={handleTitleKeyDown}
          onBlur={() => handleBlur(setIsEditingTitle)}
          className={`${
            isDocumentTitle
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
            onClick={() => handleClick(subtitleRef, setIsEditingSubtitle)}
            onInput={debouncedInput}
            onKeyDown={handleSubtitleKeyDown}
            onBlur={() => handleBlur(setIsEditingSubtitle)}
            className={`${
              isDocumentTitle
                ? 'text-lg text-slate-600 mt-2'
                : 'text-sm text-slate-600 mt-1'
            } ${isEditingSubtitle ? 'rounded px-1' : 'cursor-pointer'} flex-1 outline-none`}
          >
            {subtitle}
          </h2>
        </div>
      )}
      <TitleMetadata 
        version={version}
        createdAt={createdAt}
        localUpdatedAt={localUpdatedAt} />
    </div>
  );
}
