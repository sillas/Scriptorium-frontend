'use client';

import { useRef, useState, useCallback, useEffect, use } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick } from '@/components/editor/utils';

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);

  // Track local updateAt to show in metadata,
  // as props' updateAt only changes on remote sync,
  // never on local edits.
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimerRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearDebounceTimer()
  }, [clearDebounceTimer]);


  useEffect(() => {
    setLocalUpdatedAt(updatedAt);
  }, [updatedAt]);


  const triggerLocalSave = useCallback((): boolean => {

    const newTitle = titleRef.current?.textContent.trim() || '';
    const newSubtitle = subtitleRef.current?.textContent.trim() || '';

    const data: UpdatedTitleInterface = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };

    setLocalUpdatedAt(data.updatedAt);
    onChange(data);

    if( newTitle === title.trim() && newSubtitle === (subtitle?.trim() || '') ) return false
    return true;
  }, [onChange]);


  const triggerSync = useCallback(() => {
    if(triggerLocalSave()) onRemoteSync();
  }, [onRemoteSync, triggerLocalSave]);


  const debouncedInput = useCallback(() => {
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [ triggerLocalSave ]);


  const stopEditingAndTriggerSync = useCallback(() => {
    clearDebounceTimer();
    triggerSync();
  }, [triggerSync]);

  const shouldStopEditing = useCallback((key: string) => ['Tab', 'Enter', 'Escape'].includes(key), []);

  const handleFinishEditing = useCallback((setIsEditing: React.Dispatch<React.SetStateAction<boolean>>) => {
    stopEditingAndTriggerSync();
    setIsEditing(false);
  }, [stopEditingAndTriggerSync]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>, setIsEditing: React.Dispatch<React.SetStateAction<boolean>>): boolean => {
    if (!shouldStopEditing(e.key)) return false;
    e.preventDefault();
    stopEditingAndTriggerSync();
    setIsEditing(false);
    return true
  }, [stopEditingAndTriggerSync, shouldStopEditing]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>) => {

    if (!handleKeyDown(e, setIsEditingTitle)) return

    if (e.key === 'Tab' && subtitle) {
      setIsEditingSubtitle(true);
      subtitleRef.current?.focus();
    }
  }, [handleKeyDown, subtitle]);

  const handleSubtitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>) => {
    handleKeyDown(e, setIsEditingSubtitle)
  }, [handleKeyDown]);

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
          onClick={(e) => handleClick(e, titleRef, isEditingTitle, setIsEditingTitle)}
          onInput={debouncedInput}
          onKeyDown={handleTitleKeyDown}
          onBlur={() => handleFinishEditing(setIsEditingTitle)}
          className={`${
            isDocumentTitle
              ? 'text-3xl font-bold text-slate-900'
              : 'text-xl font-semibold text-slate-800'
          } ${isEditingTitle ? 'rounded px-1' : 'cursor-text'} flex-1 outline-none`}
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
            onClick={(e) => handleClick(e, subtitleRef, isEditingSubtitle, setIsEditingSubtitle)}
            onInput={debouncedInput}
            onKeyDown={handleSubtitleKeyDown}
            onBlur={() => handleFinishEditing(setIsEditingSubtitle)}
            className={`${
              isDocumentTitle
                ? 'text-lg text-slate-600 mt-2'
                : 'text-sm text-slate-600 mt-1'
            } ${isEditingSubtitle ? 'rounded px-1' : 'cursor-text'} flex-1 outline-none`}
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
