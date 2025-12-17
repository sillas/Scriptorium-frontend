'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { EditableHeading, EditableHeadingHandle } from './EditableHeading';

export interface TitleUpdateData {
  title: string;
  subtitle: string;
  updatedAt?: Date;
}

const KEYS_TAB_ENTER_ESCAPE = ['Tab', 'Enter', 'Escape'];

interface TitleProps {
  title: string;
  subtitle?: string;
  version?: number;
  updatedAt?: Date;
  createdAt?: Date;
  isSynced: boolean;
  isDocumentLevel: boolean;
  onRemoteSync: () => void;
  onChange: (data: TitleUpdateData, isNew?: boolean) => void;
  onSubtitleTab?: () => boolean;
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
  onSubtitleTab,
}: TitleProps) {
  const DEBOUNCE_DELAY_MS = 700;
  
  // Track local updateAt to show in metadata,
  // as props' updateAt only changes on remote sync,
  // never on local edits.
  const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
  
  const previousContentSnapshot = useRef<string>(title + (subtitle || ''));
  const titleRef = useRef<EditableHeadingHandle>(null);
  const subtitleRef = useRef<EditableHeadingHandle>(null);
  // Use browser-compatible timeout return type to avoid NodeJS vs browser type conflicts
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Clears the active debounce timer if one exists.
   * Resets the debounce timer reference to null after clearing.
   */
  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimeoutRef.current) return;
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = null;
  }, []);


  useEffect(() => {
    return () => clearDebounceTimer()
  }, [clearDebounceTimer]);

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
  const persistLocalChanges = useCallback((): void => {
    if (previousContentSnapshot.current === null) return;

    const [newTitle, newSubtitle] = getTitleAndSubtitleContent();
    if( newTitle + newSubtitle === previousContentSnapshot.current ) return;
    
    const data: TitleUpdateData = {
      title: newTitle,
      subtitle: newSubtitle,
      updatedAt: new Date(),
    };
    
    previousContentSnapshot.current = newTitle + newSubtitle;
    setLocalUpdatedAt(data.updatedAt);
    onChange(data);
  }, [onChange]);

  /**
   * Triggers a local save and initiates remote synchronization if the document is not already synced.
   * Calls the onRemoteSync callback only when the document has unsaved changes.
   */
  const synchronize = useCallback(() => {
    persistLocalChanges()

    if( isSynced ) return;

    onRemoteSync();
  }, [isSynced, onRemoteSync, persistLocalChanges]);

  /**
   * Handles input changes with a debounce delay.
   * Clears any existing debounce timer and sets a new one to trigger local save after the delay period.
   */
  const handleInputWithDebounce = useCallback(() => {
    clearDebounceTimer();
    debounceTimeoutRef.current = setTimeout(persistLocalChanges, DEBOUNCE_DELAY_MS);
  }, [ persistLocalChanges ]);

  /**
   * Stops the editing process by clearing the debounce timer and immediately triggering synchronization.
   * Called when the user finishes editing (e.g., on blur or specific key press).
   */
  const handleEditingComplete = useCallback(() => {
    clearDebounceTimer();
    synchronize();
  }, [synchronize]);

  /**
   * Handles keyboard events for the title heading element.
   * @param e - The keyboard event from the title heading element
   * @returns `true` if the event should stop editing (Tab with subtitle, Enter, or Escape), `false` otherwise
   * 
   * @remarks
   * - Tab key moves focus to subtitle if it exists
   * - Enter and Escape keys stop editing mode
   * - Prevents default Tab behavior when subtitle is present
   */
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>): boolean => {
    
    // Only handle Tab, Enter and Escape keys
    if (!KEYS_TAB_ENTER_ESCAPE.includes(e.key)) return false;
    
    // Handle Tab key to move focus to subtitle if it exists
    if (e.key === 'Tab' && subtitle) {
      e.preventDefault();
      subtitleRef.current?.focus();
      return true;
    }
    
    // Enter and Escape should stop editing
    return true;
  }, [subtitle]);

  /**
   * Handles keyboard events for the subtitle heading element.
   * @param e - The keyboard event from the subtitle heading element
   * @returns `true` if the event should stop editing (Tab, Enter, or Escape pressed), `false` otherwise
   * 
   * @remarks
   * - If Tab is pressed and `onSubtitleTab` callback is provided, it attempts to move focus to the first paragraph
   * - Prevents default Tab behavior if the callback successfully handles the event
   * - Automatically stops editing mode on Tab, Enter, or Escape key press
   */
  const handleSubtitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>): boolean => {
    // Handle Tab key to move focus to first paragraph if callback is provided
    if (e.key === 'Tab' && onSubtitleTab) {
      const handled = onSubtitleTab();
      if (handled) {
        e.preventDefault();
        return true;
      }
    }
    
    // Tab, Enter and Escape should stop editing
    if (KEYS_TAB_ENTER_ESCAPE.includes(e.key)) {
      return true;
    }
    
    return false;
  }, [onSubtitleTab]);

  return (
    <div
      className={`${
        isDocumentLevel
          ? 'px-8 mb-6 rounded-lg'
          : 'px-3 mb-3 rounded-md'
      } bg-slate-100 relative`}
    >
      <div className={`absolute top-0 right-0 ${isDocumentLevel ? 'mr-3' : ''}`}>
        <SyncIndicator isSynced={isSynced} />
      </div>

      <div className="flex items-center gap-2">
        <EditableHeading
          ref={titleRef}
          content={title}
          level="title"
          isDocumentLevel={isDocumentLevel}
          onInput={handleInputWithDebounce}
          onFinishEditing={handleEditingComplete}
          onKeyDown={handleTitleKeyDown}
        />
      </div>
      
      {subtitle && (
        <div className="flex items-center gap-2">
          <EditableHeading
            ref={subtitleRef}
            content={subtitle}
            level="subtitle"
            isDocumentLevel={isDocumentLevel}
            onInput={handleInputWithDebounce}
            onFinishEditing={handleEditingComplete}
            onKeyDown={handleSubtitleKeyDown}
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
