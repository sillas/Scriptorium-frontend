'use client';

import { useCallback, useEffect, useState } from 'react';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/columns/SideColumn';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
// import { Paragraph } from '@/components/editor/editorComponents/Paragraph';
import { Title } from '@/components/editor/editorComponents/Title';
// import { useIsOnline } from '@/components/OnlineStatusProvider';
import {
  DocumentInterface,
  ChapterInterface,
  ParagraphInterface,
  ActiveParagraphInterface,
} from '@/components/editor/utils/interfaces';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { Paragraph } from './editorComponents/Paragraph';
import { 
  // updateDocumentWithChapter, 
  // reorderParagraphs,
  createParagraphObject
} from '@/components/editor/utils/helpers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigation } from '@/hooks/useNavigation';
// import { useSync } from '@/hooks/useSync';

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

  const [localDocument, setLocalDocument] = useState<DocumentInterface>(document);
  const [localChapters, setLocalChapters] = useState<ChapterInterface[]>(chapters);
  const [localParagraphs, setLocalParagraphs] = useState<ParagraphInterface[]>(paragraphs);
  // const [chaptersSideMenu, setChaptersSideMenu] = useState<{id: string, index: number, title: string}[]>([]);
  // const [shouldAddNewChapter, setShouldAddNewChapter] = useState(false);
  // const [shouldAddNewParagraph, setShouldAddNewParagraph] = useState<ChapterInterface | null>(null);
  // const [shouldAddNewParagraphAbove, setShouldAddNewParagraphAbove] = useState<{chapter: ChapterInterface, paragraphIndex: number} | null>(null);
  const [activeParagraph, setActiveParagraph] = useState<ActiveParagraphInterface | null>(null);
  const { paragraphLocalSave } = useLocalStorage();

  // custom hooks
  // const { 
    // documentLocalSave, 
    // chapterLocalSave, 
    // paragraphLocalSave, 
  //   deleteParagraph, 
  // } = useLocalStorage();
  const { 
    navigateToAdjacentParagraph,
    getNavigationAvailability,
    // onSubtitleTab
  } = useNavigation();
  // const { syncStatus } = useSync();
  // const isOnline = useIsOnline();


  const handleReorderParagraphs = useCallback((
    paragraphs: ParagraphInterface[] | undefined,
    chIndex: number,
    pIndex: number,
    direction: 'up' | 'down'
  ) => {
    // reorderParagraphs(
    //   paragraphs ?? [],
    //   chIndex,
    //   pIndex,
    //   direction,
    //   localDocument,
    //   setLocalDocument,
    //   paragraphLocalSave
    // )

    console.log('Reorder...');
  }, []);

  /**
   * Re-indexes paragraphs from a specific position and saves them
   * @param paragraphs - Array of paragraphs to update
   * @param fromIndex - Starting index for re-indexation
   */
  const reindexAndSaveParagraphs = useCallback((paragraphs: ParagraphInterface[], fromIndex: number) => {
    const paragraphsToUpdate: ParagraphInterface[] = [];
    
    for (let i = fromIndex; i < paragraphs.length; i++) {
      const updated = { ...paragraphs[i], index: i };
      paragraphs[i] = updated;
      paragraphsToUpdate.push(updated);
    }

    // Update UI immediately (optimistic update)
    setLocalParagraphs(paragraphs);

    // Parallelize all save operations in background
    if (paragraphsToUpdate.length > 0) {
      Promise.all(paragraphsToUpdate.map(p => paragraphLocalSave(p)));
    }
  }, [paragraphLocalSave]);

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

  // useEffect(() => {
  //   setChaptersSideMenu(localDocument.chapters!.map((ch) => ({
  //     id: ch.id,
  //     index: ch.index,
  //     title: ch.title === '' ? '#Empty' : ch.title,
  //   })));
  // }, [localDocument]);

  // Add new chapter when shouldAddNewChapter is set
  // useEffect(() => {
  //   if (shouldAddNewChapter) {
  //     (async () => {
  //       const documentUpdated = { ...localDocument };
  //       const now = new Date();
  //       const lastIndex = documentUpdated.chapters!.length > 0 
  //         ? Math.max(...documentUpdated.chapters!.map(ch => ch.index))
  //         : 0;
        
  //       const shouldAddNewChapterData: ChapterInterface = {
  //         id: `temp-${crypto.randomUUID()}`,
  //         documentId: documentUpdated.id,
  //         index: lastIndex + 1,
  //         title: "",
  //         subtitle: "",
  //         paragraphs: [],
  //         createdAt: now,
  //         updatedAt: now,
  //         sync: false,
  //         version: 1,
  //         wordCount: 0
  //       };

  //       documentUpdated.chapters!.push(shouldAddNewChapterData);
  //       const result = await chapterLocalSave(shouldAddNewChapterData);
  //       if(!result) return;

  //       setLocalDocument(documentUpdated);
  //       setShouldAddNewChapter(false);
  //       setTimeout(() => setActiveParagraph(null), 100);
  //     })();
  //   }
  // }, [
  //   shouldAddNewChapter, 
  //   localDocument, 
  //   chapterLocalSave
  // ]);
  

  // Add new paragraph at specific position (above existing paragraph)
  // useEffect(() => {
  //   if (!shouldAddNewParagraphAbove) return;

  //   (async () => {
  //     const { chapter: thisChapter, paragraphIndex } = { ...shouldAddNewParagraphAbove };
  //     const chapterParagraphs = thisChapter.paragraphs ?? [];
      
  //     const newParagraph = createParagraphObject(
  //       localDocument.id, thisChapter.id, paragraphIndex);
      
  //     // Insert at specific position
  //     thisChapter.paragraphs = [
  //       ...chapterParagraphs.slice(0, paragraphIndex),
  //       newParagraph,
  //       ...chapterParagraphs.slice(paragraphIndex)
  //     ];
      
  //     // Re-index all paragraphs
  //     thisChapter.paragraphs = thisChapter.paragraphs.map((p, idx) => ({
  //       ...p,
  //       index: idx
  //     }));

  //     if (await updateDocumentWithChapter(
  //       localDocument,
  //       thisChapter,
  //       newParagraph,
  //       setLocalDocument,
  //       setActiveParagraph,
  //       paragraphLocalSave,
  //     )) {
  //       setShouldAddNewParagraphAbove(null);
  //     }
  //   })();
  // }, [shouldAddNewParagraphAbove, localDocument.id, paragraphLocalSave]);

  const createParagraph = useCallback((chapterId: string, paragraphIndex: number | null = null) => {
    const newParagraph = createParagraphObject(
      localDocument.id,
      chapterId,
      paragraphIndex !== null ? paragraphIndex : localParagraphs.length,
    );

    // Simple case: append to end
    if(paragraphIndex === null) {
      setLocalParagraphs(prev => [...prev, newParagraph]);
      paragraphLocalSave(newParagraph); // Fire-and-forget: save in background
      return;
    }

    // Insert at specific position
    const updatedParagraphs = [...localParagraphs];
    updatedParagraphs.splice(paragraphIndex, 0, newParagraph);
    
    // Re-index and save affected paragraphs
    reindexAndSaveParagraphs(updatedParagraphs, paragraphIndex);
    setActiveParagraph({ id: updatedParagraphs[paragraphIndex].id, direction: null});
  }, [localDocument.id, localParagraphs, reindexAndSaveParagraphs]);

  const deleteParagraph = useCallback((paragraphIndex: number) => {
    // Remove paragraph at specified index
    const updatedParagraphs = localParagraphs.filter(p => p.index !== paragraphIndex);
    
    // Re-index and save all paragraphs from deletion point onwards
    reindexAndSaveParagraphs(updatedParagraphs, paragraphIndex);
  }, [localParagraphs, reindexAndSaveParagraphs]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Barra Superior */}
      <EditorHeader slug={document.title} />

      {/* Container Principal */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Coluna Lateral Esquerda */}
        <SideColumn side="left">
          <div className="text-sm text-slate-200">
            <Contents
                chapters={localChapters}
              />
          </div>
        </SideColumn>

        {/* Coluna Central */}
        <main
          className={`bg-slate-100 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
        >
          {/* Sync Status Indicator */}
          {/* {syncStatus.pendingItems > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              {isOnline
                ? `Sincronizando ${syncStatus.pendingItems} ${syncStatus.pendingItems === 1 ? 'item' : 'itens'}...`
                : `${syncStatus.pendingItems} ${syncStatus.pendingItems === 1 ? 'item' : 'itens'} pendente${syncStatus.pendingItems === 1 ? '' : 's'} (offline)`}
            </div>
          )} */}

          {/* Document Title */}
          <Title
            isDocumentLevel={true}
            title={localDocument.title}
            subtitle={localDocument.subtitle}
            version={localDocument.version}
            updatedAt={localDocument.updatedAt}
            createdAt={localDocument.createdAt}
            isSynced={localDocument.sync}
            onRemoteSync={() => {}}
            onChange={(data) => true}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localChapters.map((chapter) => (
            <Chapter
              key={chapter.id} 
              chapter={chapter}
            >
              {localParagraphs.filter(p => p.chapterId === chapter.id).map((paragraph) => (
                  <Paragraph 
                    key={paragraph.id}
                    paragraph={paragraph}
                    focusActivation={activeParagraph?.id === paragraph.id ? { direction: activeParagraph.direction } : null}
                    navigation={getNavigationAvailability(paragraph.index, localParagraphs)}
                    onNavigate={(direction) => navigateToAdjacentParagraph(direction, paragraph.index, localParagraphs, setActiveParagraph)}
                    onDelete={() => deleteParagraph(paragraph.index)}
                    onCreateNewParagraphAbove={() => createParagraph(chapter.id, paragraph.index)}
                  />
                ))}
              {/* Add Paragraph Button */}
              <AddButton type="paragraph" onClick={() => createParagraph(chapter.id)} />
            </Chapter>
          ))}
          
          {/* Add Chapter Button */}
          <AddButton type="chapter" onClick={() => {}} />
        </main>

        {/* Coluna Lateral Direita */}
        <SideColumn side="right">
          <div className="text-sm text-slate-200">Coluna Direita</div>
        </SideColumn>
      </div>
    </div>
  );
}