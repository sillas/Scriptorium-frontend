'use client';

import { useRef, useState, useCallback } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { EditableHeading, EditableHeadingHandle } from './EditableHeading';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';

export interface TitleUpdateData {
  title: string;
  subtitle: string;
  updatedAt?: Date;
}

const DEBOUNCE_DELAY_MS = 700;
interface TitleProps {
  title: string;
  subtitle?: string;
  version?: number;
  updatedAt?: Date;
  createdAt?: Date;
  isSynced?: boolean;
  isDocumentLevel?: boolean;
  onRemoteSync?: (data: TitleUpdateData) => void;
  onChange?: (data: TitleUpdateData) => void;
  onFocus?: () => void;
  fontClass?: string;
}

interface TitleMetadataProps {
  version?: number;
  createdAt?: Date;
  localUpdatedAt?: Date;
}

/**
 * Displays metadata information for a title component.
 * @param version - Optional version number of the document
 * @param createdAt - Optional creation date of the document
 * @param localUpdatedAt - Optional last update date of the document
 * @returns A formatted metadata display showing version, creation date, and last update time
 */
const TitleMetadata = ({version, createdAt, localUpdatedAt}:TitleMetadataProps) => (
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
  isDocumentLevel,
  onRemoteSync,
  onChange,
  onFocus,
  fontClass = '',
}: TitleProps) {
  const previousContentSnapshot = useRef<string>(title + (subtitle || ''));
  const titleRef = useRef<EditableHeadingHandle>(null);
  const subtitleRef = useRef<EditableHeadingHandle>(null);

  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  /**
   * Retrieves the current text content from both title and subtitle elements.
   * @returns A tuple containing the current title and subtitle text content
   */
  const getTitleAndSubtitleContent = useCallback((): [string, string] => {
    const newTitle = titleRef.current?.getTextContent() || '';
    const newSubtitle = subtitleRef.current?.getTextContent() || '';
    return [newTitle, newSubtitle];
  }, []);

  /**
   * Saves the current title and subtitle changes locally if they differ from the previous values.
   * Updates the local timestamp and invokes the onChange callback with the new data.
   */
  const persistLocalChanges = useCallback((force: boolean = false): TitleUpdateData | undefined => {
    if (previousContentSnapshot.current === null) return;

    const [newTitle, newSubtitle] = getTitleAndSubtitleContent();

    const snapshot = newTitle + newSubtitle
    if( !force && snapshot === previousContentSnapshot.current ) return;
    previousContentSnapshot.current = snapshot;
    
    const data: TitleUpdateData = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };
    
    setLocalUpdatedAt(data.updatedAt);
    onChange?.(data);    
    return data;
  }, [onChange, getTitleAndSubtitleContent]);


  /**
   * Handles input changes with a debounce delay.
   * Clears any existing debounce timer and sets a new one to trigger local save after the delay period.
   */
  const handleInputWithDebounce = useCallback(() => {
    clearDebounceTimer();
    setDebounce(persistLocalChanges, DEBOUNCE_DELAY_MS);
  }, [ persistLocalChanges ]);

  /**
   * Stops the editing process by clearing the debounce timer and immediately triggering synchronization.
   * Called when the user finishes editing (e.g., on blur or specific key press).
   */
  const handleEditingComplete = useCallback(() => {
    clearDebounceTimer();
    const data = persistLocalChanges(true);    
    if(data) onRemoteSync?.(data);
  }, [persistLocalChanges, onRemoteSync]);

  return (
    <div
      onFocus={onFocus}
      className={`${
        isDocumentLevel
          ? 'px-8 mb-6 rounded-lg'
          : 'px-3 mb-3 rounded-md'
      } bg-gray-100 relative ${fontClass}`}
    >
      <div className={`absolute top-0 right-0 ${isDocumentLevel ? 'mr-3' : ''}`}>
        <SyncIndicator isSynced={isSynced ?? false} />
      </div>

      <div className="flex items-center gap-2 pl-[5px] border-l-2 border-gray-300">
        <EditableHeading
          ref={titleRef}
          content={title}
          level="title"
          isDocumentLevel={isDocumentLevel ?? false}
          onInput={handleInputWithDebounce}
          onFinishEditing={handleEditingComplete}
          className={fontClass}
        />
      </div>
      <div className="flex items-center gap-2 pl-[5px] border-l-2 border-gray-300">
        <EditableHeading
          ref={subtitleRef}
          content={subtitle}
          level="subtitle"
          isDocumentLevel={isDocumentLevel ?? false}
          onInput={handleInputWithDebounce}
          onFinishEditing={handleEditingComplete}
          className={fontClass}
        />
      </div>

      { isDocumentLevel && <TitleMetadata 
        version={version}
        createdAt={createdAt}
        localUpdatedAt={localUpdatedAt} />}
    </div>
  );
}
