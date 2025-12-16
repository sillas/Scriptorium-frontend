'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { EditableHeading, EditableHeadingHandle } from './EditableHeading';

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
        Updated: {localUpdatedAt.toLocaleDateString()} {localUpdatedAt.toLocaleTimeString()}
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
  
  // Track local updateAt to show in metadata,
  // as props' updateAt only changes on remote sync,
  // never on local edits.
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  
  const previousTitleAndSubtitle = useRef<string>(title + (subtitle || ''));
  const titleRef = useRef<EditableHeadingHandle>(null);
  const subtitleRef = useRef<EditableHeadingHandle>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimerRef.current) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);


  useEffect(() => {
    return () => clearDebounceTimer()
  }, [clearDebounceTimer]);

  
  const getNewTitleAndSubtitle = useCallback((): [string, string] => {
    const newTitle = titleRef.current?.getTextContent() || '';
    const newSubtitle = subtitleRef.current?.getTextContent() || '';
    return [newTitle, newSubtitle];
  }, []);


  const triggerLocalSave = useCallback((): void => {
    if (!titleRef.current || !subtitleRef.current || !previousTitleAndSubtitle.current) return;

    const [newTitle, newSubtitle] = getNewTitleAndSubtitle();
    if( newTitle + newSubtitle === previousTitleAndSubtitle.current ) return;
    
    const data: UpdatedTitleInterface = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };
    
    previousTitleAndSubtitle.current = newTitle + newSubtitle;
    setLocalUpdatedAt(data.updatedAt);
    onChange(data);
  }, [onChange]);


  const triggerSync = useCallback(() => {
    triggerLocalSave()

    if( isSynced ) return

    onRemoteSync();
  }, [onRemoteSync, triggerLocalSave]);


  const debouncedInput = useCallback(() => {
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(triggerLocalSave, DEBOUNCE_DELAY_MS);
  }, [ triggerLocalSave ]);


  const stopEditingAndTriggerSync = useCallback(() => {
    clearDebounceTimer();
    triggerSync();
  }, [triggerSync]);

  
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>): boolean => {
    if (!['Tab', 'Enter', 'Escape'].includes(e.key)) return false;
    
    if (e.key === 'Tab' && subtitle) {
      e.preventDefault();
      subtitleRef.current?.focus();
      return true;
    }
    
    return false;
  }, [subtitle]);

  return (
    <div
      className={`${
        isDocumentTitle
          ? 'px-8 mb-6 rounded-lg'
          : 'px-3 mb-3 rounded-md'
      } bg-slate-100 relative`}
    >
      <div className={`absolute top-0 right-0 ${isDocumentTitle ? 'mr-3' : ''}`}>
        <SyncIndicator isSynced={isSynced} isOnline={isOnline} />
      </div>

      <div className="flex items-center gap-2">
        <EditableHeading
          ref={titleRef}
          content={title}
          level="title"
          isDocumentLevel={isDocumentTitle}
          onInput={debouncedInput}
          onFinishEditing={stopEditingAndTriggerSync}
          onKeyDown={handleTitleKeyDown}
        />
      </div>
      
      {subtitle && (
        <div className="flex items-center gap-2">
          <EditableHeading
            ref={subtitleRef}
            content={subtitle}
            level="subtitle"
            isDocumentLevel={isDocumentTitle}
            onInput={debouncedInput}
            onFinishEditing={stopEditingAndTriggerSync}
          />
        </div>
      )}
      <TitleMetadata 
        version={version}
        createdAt={createdAt}
        localUpdatedAt={localUpdatedAt} />
    </div>
  );
}
