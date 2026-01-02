'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/editorComponents/SideColumn';
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
} from '@/components/editor/utils/interfaces';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { Paragraph } from '@/components/editor/editorComponents/Paragraph';
import { createParagraphObject } from '@/components/editor/utils/helpers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigation } from '@/hooks/editor/useNavigation';

interface EditorClientSideProps {
  id: string;
  document: DocumentInterface;
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
export function EditorClientSide({ id, document, chapters, paragraphs }: EditorClientSideProps) {

  const isNavigatingRef = useRef(false);
  const [localDocument, setLocalDocument] = useState<DocumentInterface>(document);
  const [localChapters, setLocalChapters] = useState<ChapterInterface[]>(chapters);
  const [localParagraphs, setLocalParagraphs] = useState<ParagraphInterface[]>(paragraphs);
  const [shouldAddNewChapter, setShouldAddNewChapter] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState<ActiveParagraphInterface | null>(null);
  const { 
    SaveItemOnIndexedDB,
    handleDeleteAndReindex, 
    reindexAndSave,
  } = useLocalStorage();
  
  // Track pending IndexedDB save operations
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
        SaveItemOnIndexedDB(updatedParagraphs[paragraphIndex], null, 'paragraph');
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
      SaveItemOnIndexedDB(currentParagraph, null, 'paragraph');
      return
    }

    // Swap paragraphs, same chapter
    [updatedParagraphs[paragraphIndex], updatedParagraphs[targetIndex]] = 
      [updatedParagraphs[targetIndex], updatedParagraphs[paragraphIndex]];
    
    // Re-index and save affected paragraphs
    reindexAndSave(
      updatedParagraphs, 
      Math.min(paragraphIndex, targetIndex), 
      'paragraph',
      setLocalParagraphs
    );
    setActiveParagraph({ id: updatedParagraphs[targetIndex].id, direction: null });
  }, [localParagraphs, localChapters, reindexAndSave, SaveItemOnIndexedDB]);

  // // Load unsynced data from IndexedDB on mount
  useEffect(() => {
    loadUnsyncedData(
      document, 
      chapters, 
      paragraphs, 
      setLocalDocument,
      setLocalChapters,
      setLocalParagraphs
    );
  }, [document, chapters, paragraphs]);

  
  // Add new chapter when shouldAddNewChapter is set
  useEffect(() => {
    if (!shouldAddNewChapter) return;

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
    setShouldAddNewChapter(false);

    // save new chapter to IndexedDB in backgroun
    SaveItemOnIndexedDB(newChapterData, null, 'chapter')
  }, [
    shouldAddNewChapter, 
    localDocument.id,
    localChapters
  ]);


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
      SaveItemOnIndexedDB(newParagraph, null, 'paragraph');
      return;
    }

    // Insert at specific position
    const updatedParagraphs = [...localParagraphs];
    updatedParagraphs.splice(paragraphIndex, 0, newParagraph);
    
    // Re-index and save affected paragraphs
    reindexAndSave(updatedParagraphs, paragraphIndex, 'paragraph', setLocalParagraphs);
    setActiveParagraph({ id: updatedParagraphs[paragraphIndex].id, direction: null});
  }, [localDocument.id, localParagraphs, reindexAndSave]);

  const handleDeleteChapter = useCallback((chapterIndex: number) => {
    handleDeleteAndReindex<ChapterInterface>(localChapters, 'chapter', chapterIndex, setLocalChapters);
  }, [handleDeleteAndReindex, localChapters]);

  const handleDeleteParagraph = useCallback((paragraphIndex: number) => {
    handleDeleteAndReindex<ParagraphInterface>(localParagraphs, 'paragraph', paragraphIndex, setLocalParagraphs);
  }, [handleDeleteAndReindex, localParagraphs]);

  // TODO: implement actual sync logic
  const syncAll = useCallback((origin: string) => {
    // Placeholder for future sync logic
    console.log('Sync all items triggered from:', origin);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Barra Superior */}
      <EditorHeader slug={document.title} />

      {/* Container Principal */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Coluna Lateral Esquerda */}
        <SideColumn side="left">
          <div className="text-sm text-gray-800">
            <Contents
                chapters={localChapters}
              />
          </div>
        </SideColumn>

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
            onRemoteSync={() => syncAll('document')}
            onChange={(data) => true}
            onFocus={() => setActiveParagraph(null)}
            fontClass={localDocument.fontClass || "font-merriweather"}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localChapters.map((chapter, chapterIndex) => (
            <Chapter
              key={chapter.id}
              chapter={chapter}
              setLocalChapters={setLocalChapters}
              onFocus={() => setActiveParagraph(null)}
              oneDelete={() => handleDeleteChapter(chapterIndex)}
              onRemoteSync={() => syncAll('chapter')}
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
                    onRemoteSync={() => syncAll('paragraph')}
                    isNavigatingRef={isNavigatingRef}
                  />
                ))}

              {/* Add Paragraph Button */}
              <AddButton type="paragraph" onClick={() => createParagraph(chapter.id)} />
            </Chapter>
          ))}
          
          {/* Add Chapter Button */}
          <AddButton type="chapter" onClick={() => setShouldAddNewChapter(true)} />
        </main>

        {/* Coluna Lateral Direita */}
        <SideColumn side="right">
          <div className="text-sm text-gray-800 p-4">Right</div>
        </SideColumn>
      </div>
    </div>
  );
}