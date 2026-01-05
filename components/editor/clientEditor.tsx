'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsOnline } from '@/components/OnlineStatusProvider';
import EditorHeader from '@/components/editor/Header';
import LeftColumn from '@/components/editor/editorComponents/LeftColumn';
import RightColumn from '@/components/editor/editorComponents/RightAside';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { Title } from '@/components/editor/editorComponents/Title';
import {
  DocumentInterface,
  ChapterInterface,
  ParagraphInterface,
  ActiveParagraphInterface,
  NavigationDirection,
  TitleUpdateData,
} from '@/components/editor/types';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { Paragraph } from '@/components/editor/editorComponents/Paragraph';
import { createParagraphObject, updateLocalState } from '@/lib/editor/paragraph-helpers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigation } from '@/hooks/editor/useNavigation';
import { useSyncBackground } from '@/hooks/editor/useSyncBackground';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { generateSlug } from '@/lib/slug-helpers';

interface ClientEditorProps {
  initialDocument: DocumentInterface;
  chapters: ChapterInterface[];
  paragraphs: ParagraphInterface[];
}

/**
 * Client-side editor for a single document.
 *
 * Handles local state for the document, optimistic UI updates, and
 * saving unsynced changes to local storage / IndexedDB via helper hooks.
 *
 * Props:
 * @param slug - document slug (used in header routing)
 * @param theDocument - initial document data fetched from the server
 */
export function ClientEditor({ initialDocument, chapters, paragraphs }: ClientEditorProps) {
  const documentId = initialDocument.id;
  const isOnline = useIsOnline();
  const isNavigatingRef = useRef(false);
  const [syncInProgress, setSyncInProgress] = useState(true);
  const [localDocument, setLocalDocument] = useState<DocumentInterface>(initialDocument);
  const [localChapters, setLocalChapters] = useState<ChapterInterface[]>(chapters);
  const [localParagraphs, setLocalParagraphs] = useState<ParagraphInterface[]>(paragraphs);
  const [activeParagraph, setActiveParagraph] = useState<ActiveParagraphInterface | null>(null);
  const [ setDebounce, clearDebounceTimer ] = useDebounceTimer();
  const { 
    SaveItemOnIndexedDB,
    handleDeleteAndReindex, 
    reindexAndSave,
    waitForPendingSaves,
  } = useLocalStorage();
  
  const { syncAllItems } = useSyncBackground();
  const {
    navigateToAdjacentParagraph,
    getNavigationAvailability,
  } = useNavigation();

  const handleReorderParagraphs = useCallback((
    direction: NavigationDirection,
    paragraphIndex: number,
    chapterIndex: number
  ) => {
    const targetIndex = direction === 'Up' ? paragraphIndex - 1 : paragraphIndex + 1;
    if(targetIndex < 0) return

    const updatedParagraphs = [...localParagraphs];
    
    if(targetIndex >= localParagraphs.length) {
      if( chapterIndex < localChapters.length - 1) {
        updatedParagraphs[paragraphIndex].chapterId = localChapters[chapterIndex + 1].id;
        setLocalParagraphs(updatedParagraphs);
        setActiveParagraph({ id: updatedParagraphs[paragraphIndex].id, direction: null });
        SaveItemOnIndexedDB(updatedParagraphs[paragraphIndex], null, 'paragraphs');
      }
      return
    }
    
    const currentParagraph = updatedParagraphs[paragraphIndex];
    const targetParagraph = updatedParagraphs[targetIndex];

    // Copy chapters, if needed, preserving ordering
    if (currentParagraph.chapterId !== targetParagraph.chapterId) {
      currentParagraph.chapterId = targetParagraph.chapterId

      setLocalParagraphs(updatedParagraphs);
      setActiveParagraph({ id: currentParagraph.id, direction: null });
      SaveItemOnIndexedDB(currentParagraph, null, 'paragraphs');
      return
    }

    // Swap paragraphs, same chapter
    [updatedParagraphs[paragraphIndex], updatedParagraphs[targetIndex]] = 
      [updatedParagraphs[targetIndex], updatedParagraphs[paragraphIndex]];
    
    // Re-index and save affected paragraphs
    reindexAndSave(
      updatedParagraphs, 
      Math.min(paragraphIndex, targetIndex), 
      'paragraphs',
      setLocalParagraphs
    );
    setActiveParagraph({ id: updatedParagraphs[targetIndex].id, direction: null });
  }, [localParagraphs, localChapters, reindexAndSave, SaveItemOnIndexedDB]);


  const createParagraph = useCallback((chapterId: string, paragraphIndex: number | null = null) => {
    const newParagraph = createParagraphObject(
      localDocument.id,
      chapterId,
      paragraphIndex !== null ? paragraphIndex : localParagraphs.length,
    );

    // Simple case: append to end
    if(paragraphIndex === null) {
      setLocalParagraphs(prev => [...prev, newParagraph]);
      setActiveParagraph({ id: newParagraph.id, direction: null });
      SaveItemOnIndexedDB(newParagraph, null, 'paragraphs');
      return;
    }

    // Insert at specific position
    const updatedParagraphs = [...localParagraphs];
    updatedParagraphs.splice(paragraphIndex, 0, newParagraph);
    
    // Re-index and save affected paragraphs
    reindexAndSave(updatedParagraphs, paragraphIndex, 'paragraphs', setLocalParagraphs);
    setActiveParagraph({ id: updatedParagraphs[paragraphIndex].id, direction: null});
  }, [localDocument.id, localParagraphs, reindexAndSave]);

  const syncAllWithoutDebounce = useCallback(() => {
    if(!isOnline) return;
    setSyncInProgress(true);
    waitForPendingSaves().then( async () => {
      const {syncedDocument, syncedChapters, syncedParagraphs} = await syncAllItems(documentId);
      updateLocalState(syncedChapters, setLocalChapters);
      updateLocalState(syncedParagraphs, setLocalParagraphs);
      if(syncedDocument) setLocalDocument(syncedDocument);
      setSyncInProgress(false);
    });
  }, [isOnline]);

  const handleDeleteChapter = useCallback((chapterIndex: number) => {
    handleDeleteAndReindex<ChapterInterface>(localChapters, 'chapters', chapterIndex, setLocalChapters);
    syncAllWithoutDebounce();
  }, [localChapters, handleDeleteAndReindex, syncAllWithoutDebounce]);


  const handleDeleteParagraph = useCallback((paragraphIndex: number) => {    
    handleDeleteAndReindex<ParagraphInterface>(localParagraphs, 'paragraphs', paragraphIndex, setLocalParagraphs);
    syncAllWithoutDebounce();
  }, [localParagraphs, handleDeleteAndReindex, syncAllWithoutDebounce]);
   

  const handleDocumentHeadingChange = useCallback((data: TitleUpdateData) => {
    data.slug = generateSlug(data.title);
    SaveItemOnIndexedDB(localDocument, data, 'documents');
  }, [SaveItemOnIndexedDB]);

  const syncAll = useCallback(() => {    
    clearDebounceTimer();
    setDebounce(() => {
      const activeElement = document.activeElement;
      if (activeElement?.getAttribute('contenteditable') === 'true') {
        return;
      }
      syncAllWithoutDebounce();
    }, 3000); // prevent auto-sync for 3s after manual sync

  }, [setDebounce, clearDebounceTimer, syncAllWithoutDebounce]);

  // Add new chapter when shouldAddNewChapter is set
  const addNewChapter = useCallback(() => {
    const chapterLength = localChapters.length;
    const newChapterIndex = chapterLength > 0
      ? localChapters[chapterLength - 1].index + 1
      : 0;
    const now = new Date();
    const newChapterData: ChapterInterface = {
      id: `temp-${crypto.randomUUID()}`,
      documentId: localDocument.id,
      index: newChapterIndex,
      title: '',
      subtitle: '',
      createdAt: now,
      updatedAt: now,
      sync: false,
      version: 1
    };

    setLocalChapters(prev => [...prev, newChapterData]);

    // save new chapter to IndexedDB in backgroun
    SaveItemOnIndexedDB(newChapterData, null, 'chapters')
  }, [
    localDocument.id,
    localChapters
  ]);

  // ============ Effects ============
  useEffect(() => {    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Captura Ctrl+S (ou Cmd+S no Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        waitForPendingSaves().then(syncAllWithoutDebounce);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [waitForPendingSaves, syncAllWithoutDebounce]);

  // Load unsynced data from IndexedDB on mount and sync in background
  useEffect(() => {
    setSyncInProgress(true);
    loadUnsyncedData(
      initialDocument, 
      chapters, 
      paragraphs, 
      setLocalDocument,
      setLocalChapters,
      setLocalParagraphs
    ).finally(syncAllWithoutDebounce);
  }, [isOnline, initialDocument, chapters, paragraphs]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <EditorHeader slug={localDocument.title} isOnline={isOnline} syncInProgress={syncInProgress} />

      {/* Container Principal */}
      <div className="flex flex-1 overflow-hidden relative">

        <LeftColumn>
          <div className="text-sm text-gray-800">
            <Contents
                chapters={localChapters}
                syncInProgress={syncInProgress}
              />
          </div>
        </LeftColumn>

        {/* Coluna Central */}
        <main
          className={`bg-gray-100 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
        >
          {/* Document Title */}
          <Title
            isDocumentLevel={true}
            title={localDocument.title}
            subtitle={localDocument.subtitle}
            version={localDocument.version}
            updatedAt={localDocument.updatedAt}
            createdAt={localDocument.createdAt}
            isSynced={localDocument.sync}
            fontClass={localDocument.fontClass || "font-merriweather"}
            onFocus={() => setActiveParagraph(null)}
            onRemoteSync={syncAll}
            onChange={handleDocumentHeadingChange}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localChapters.map((chapter, chapterIndex) => (
            <Chapter
              key={chapter.id}
              chapter={chapter}
              setLocalChapters={setLocalChapters}
              onFocus={() => setActiveParagraph(null)}
              oneDelete={() => handleDeleteChapter(chapterIndex)}
              onRemoteSync={syncAll}
            >
              {localParagraphs.filter(p => p.chapterId === chapter.id).map((paragraph) => (
                  <Paragraph 
                    key={paragraph.id}
                    paragraph={paragraph}
                    focusActivation={activeParagraph?.id === paragraph.id ? { direction: activeParagraph.direction } : null}
                    navigation={getNavigationAvailability(paragraph.index, localParagraphs)}
                    onNavigate={(event, direction) => navigateToAdjacentParagraph(event, direction, paragraph.index, localParagraphs, setActiveParagraph)}
                    onReorder={(direction) => handleReorderParagraphs(direction, paragraph.index, chapterIndex)}
                    onDelete={() => handleDeleteParagraph(paragraph.index)}
                    onCreateNewParagraph={(paragraphIndex) => createParagraph(chapter.id, paragraphIndex)}
                    fontClass={localDocument.fontClass || "font-merriweather"}
                    onRemoteSync={syncAll}
                    onRemoteSyncNow={syncAllWithoutDebounce}
                    isNavigatingRef={isNavigatingRef}
                  />
                ))}
              <AddButton type="paragraphs" onClick={() => createParagraph(chapter.id)} />
            </Chapter>
          ))}

          <AddButton type="chapters" onClick={addNewChapter} />
        </main>

        <RightColumn>
          <div className="text-sm text-gray-800 p-4">Right</div>
        </RightColumn>
      </div>
    </div>
  );
}