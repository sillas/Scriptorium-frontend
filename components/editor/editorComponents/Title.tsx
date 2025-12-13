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
  isMainTitle: boolean;
  onSync: () => void;
  onChange: (data: UpdatedTitleInterface, isNew?: boolean) => void;
  isOnline?: boolean;
}

const TitleMetadata = ({version, createdAt, localUpdatedAt}: {
  version?: number;
  createdAt?: Date;
  localUpdatedAt?: Date;
}) => (<div className="mt-2 text-xs text-slate-500">
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
  isMainTitle,
  onSync,
  onChange,
  isOnline = true,
  version,
  updatedAt,
  createdAt,
}: TitleProps) {
  const DEBOUNCE_DELAY_MS = 700;
  const FOCUS_DELAY_MS = 0;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
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

    const newTitle = titleRef.current?.textContent || localTitle;
    const newSubtitle = subtitleRef.current?.textContent || localSubtitle;

    const data: UpdatedTitleInterface = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };

    setLocalUpdatedAt(data.updatedAt);
    onChange(data);

  }, [onChange, localTitle, localSubtitle]);


  const triggerSync = useCallback(() => {
    triggerLocalSave();
    setTimeout(onSync, FOCUS_DELAY_MS);
  }, [onSync, triggerLocalSave]);


  const debouncedInput = useCallback(() => {
    clearSyncTimer();
    syncTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [ triggerLocalSave ]);


  const handleClick = (itemRef: React.RefObject<HTMLHeadingElement | null>, setEditing: React.Dispatch<React.SetStateAction<boolean>>) => {
    setEditing(true);
    setTimeout(() => itemRef.current?.focus(), FOCUS_DELAY_MS);
  }


  const handleInput = (refItem: React.RefObject<HTMLHeadingElement | null>, setLocal: React.Dispatch<React.SetStateAction<string>>) => {
    if (refItem && refItem.current) {
      const newValue = refItem.current.textContent || '';
      setLocal(newValue);
      debouncedInput();
    }
  }

  const shouldStopEditing = (key: string) => ['Tab', 'Enter', 'Escape'].includes(key);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>): boolean => {

    if (shouldStopEditing(e.key)) {
      e.preventDefault();

      clearSyncTimer();

      triggerSync();

      return true
    }
    return false;
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {

    if (handleKeyDown(e)) {
      setIsEditingTitle(false);

      if (e.key === 'Tab' && subtitle) {
        setIsEditingSubtitle(true);
        setTimeout(() => subtitleRef.current?.focus(), FOCUS_DELAY_MS);
      }
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (handleKeyDown(e)) {
      setIsEditingSubtitle(false);
    }
  };

  const handleBlur = (setIsEditing: React.Dispatch<React.SetStateAction<boolean>>) => {
    clearSyncTimer();
    triggerSync();
    setIsEditing(false);
  }

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
          onClick={() => handleClick(titleRef, setIsEditingTitle)}
          onInput={() => handleInput(titleRef, setLocalTitle)}
          onKeyDown={handleTitleKeyDown}
          onBlur={() => handleBlur(setIsEditingTitle)}
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
            onClick={() => handleClick(subtitleRef, setIsEditingSubtitle)}
            onInput={() => handleInput(subtitleRef, setLocalSubtitle)}
            onKeyDown={handleSubtitleKeyDown}
            onBlur={() => handleBlur(setIsEditingSubtitle)}
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
      <TitleMetadata 
        version={version}
        createdAt={createdAt}
        localUpdatedAt={localUpdatedAt} />
    </div>
  );
}
