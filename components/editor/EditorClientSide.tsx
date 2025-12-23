'use client';

import { useCallback, useEffect, useState } from 'react';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/columns/SideColumn';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { Paragraph } from '@/components/editor/editorComponents/Paragraph';
import { Title } from '@/components/editor/editorComponents/Title';
import { useIsOnline } from '@/components/OnlineStatusProvider';
import {
  DocumentInterface,
  ChapterInterface,
  ParagraphInterface,
  ActiveParagraphInterface,
} from '@/components/editor/utils/interfaces';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { 
  updateDocumentWithChapter, 
  reorderParagraphs, 
  createParagraphObject
} from '@/components/editor/utils/helpers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigation } from '@/hooks/useNavigation';
import { useSync } from '@/hooks/useSync';

interface EditorClientSideProps {
  slug: string;
  theDocument: DocumentInterface;
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
export function EditorClientSide({ slug, theDocument }: EditorClientSideProps) {
  const [localDocument, setLocalDocument] = useState<DocumentInterface>(theDocument);
  const [chaptersSideMenu, setChaptersSideMenu] = useState<{id: string, index: number, title: string}[]>([]);
  const [shouldAddNewChapter, setShouldAddNewChapter] = useState(false);
  const [shouldAddNewParagraph, setShouldAddNewParagraph] = useState<ChapterInterface | null>(null);
  const [shouldAddNewParagraphAbove, setShouldAddNewParagraphAbove] = useState<{chapter: ChapterInterface, paragraphIndex: number} | null>(null);
  const [activeParagraph, setActiveParagraph] = useState<ActiveParagraphInterface | null>(null);
  
  // custom hooks
  const { 
    documentLocalSave, 
    chapterLocalSave, 
    paragraphLocalSave, 
    deleteParagraph, 
  } = useLocalStorage();
  const { 
    navigateToAdjacentParagraph,
    getNavigationAvailability,
    onSubtitleTab
  } = useNavigation();
  const { syncStatus } = useSync();
  const isOnline = useIsOnline();


  const handleReorderParagraphs = useCallback((
    paragraphs: ParagraphInterface[] | undefined,
    chIndex: number,
    pIndex: number,
    direction: 'up' | 'down'
  ) => {
    reorderParagraphs(
      paragraphs ?? [],
      chIndex,
      pIndex,
      direction,
      localDocument,
      setLocalDocument,
      paragraphLocalSave
    )
  }, [localDocument, setLocalDocument, paragraphLocalSave]);

  // Load unsynced data from IndexedDB on mount
  useEffect(() => {
    loadUnsyncedData(theDocument, setLocalDocument);
  }, [theDocument]);

  useEffect(() => {
    setChaptersSideMenu(localDocument.chapters!.map((ch) => ({
      id: ch.id,
      index: ch.index,
      title: ch.title === '' ? '#Empty' : ch.title,
    })));
  }, [localDocument]);

  // Add new chapter when shouldAddNewChapter is set
  useEffect(() => {
    if (shouldAddNewChapter) {
      (async () => {
        const documentUpdated = { ...localDocument };
        const now = new Date();
        const lastIndex = documentUpdated.chapters!.length > 0 
          ? Math.max(...documentUpdated.chapters!.map(ch => ch.index))
          : 0;
        
        const shouldAddNewChapterData: ChapterInterface = {
          id: `temp-${crypto.randomUUID()}`,
          documentId: documentUpdated.id,
          index: lastIndex + 1,
          title: "",
          subtitle: "",
          paragraphs: [],
          createdAt: now,
          updatedAt: now,
          sync: false,
          version: 1,
          wordCount: 0
        };

        documentUpdated.chapters!.push(shouldAddNewChapterData);
        const result = await chapterLocalSave(shouldAddNewChapterData);
        if(!result) return;

        setLocalDocument(documentUpdated);
        setShouldAddNewChapter(false);
      })();
    }
  }, [
    shouldAddNewChapter, 
    localDocument, 
    chapterLocalSave
  ]);
  
  // Add new paragraph at the end of chapter
  useEffect(() => {
    if (!shouldAddNewParagraph) return;

    (async () => {
      const thisChapter = { ...shouldAddNewParagraph };
      const chapterParagraphs = thisChapter.paragraphs ?? [];
      
      const lastIndex = chapterParagraphs.length > 0
        ? Math.max(...chapterParagraphs.map(p => p.index))
        : 0;
      
      const newParagraph = createParagraphObject(localDocument.id, thisChapter.id, lastIndex + 1);
      thisChapter.paragraphs = [...chapterParagraphs, newParagraph];

      if (await updateDocumentWithChapter(
        localDocument,
        thisChapter,
        newParagraph,
        setLocalDocument,
        setActiveParagraph,
        paragraphLocalSave,
      )) {
        setShouldAddNewParagraph(null);
      }
    })();
  }, [shouldAddNewParagraph, localDocument.id, paragraphLocalSave]);

  // Add new paragraph at specific position (above existing paragraph)
  useEffect(() => {
    if (!shouldAddNewParagraphAbove) return;

    (async () => {
      const { chapter: thisChapter, paragraphIndex } = { ...shouldAddNewParagraphAbove };
      const chapterParagraphs = thisChapter.paragraphs ?? [];
      
      const newParagraph = createParagraphObject(
        localDocument.id, thisChapter.id, paragraphIndex);
      
      // Insert at specific position
      thisChapter.paragraphs = [
        ...chapterParagraphs.slice(0, paragraphIndex),
        newParagraph,
        ...chapterParagraphs.slice(paragraphIndex)
      ];
      
      // Re-index all paragraphs
      thisChapter.paragraphs = thisChapter.paragraphs.map((p, idx) => ({
        ...p,
        index: idx
      }));

      if (await updateDocumentWithChapter(
        localDocument,
        thisChapter,
        newParagraph,
        setLocalDocument,
        setActiveParagraph,
        paragraphLocalSave,
      )) {
        setShouldAddNewParagraphAbove(null);
      }
    })();
  }, [shouldAddNewParagraphAbove, localDocument.id, paragraphLocalSave]);


  // ...

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Barra Superior */}
      <EditorHeader slug={slug} />

      {/* Container Principal */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Coluna Lateral Esquerda */}
        <SideColumn side="left">
          <div className="text-sm text-slate-200">
            <Contents
                chapters={chaptersSideMenu}
              />
          </div>
        </SideColumn>

        {/* Coluna Central */}
        <main
          className={`bg-slate-100 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
        >
          {/* Sync Status Indicator */}
          {syncStatus.pendingItems > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              {isOnline
                ? `Sincronizando ${syncStatus.pendingItems} ${syncStatus.pendingItems === 1 ? 'item' : 'itens'}...`
                : `${syncStatus.pendingItems} ${syncStatus.pendingItems === 1 ? 'item' : 'itens'} pendente${syncStatus.pendingItems === 1 ? '' : 's'} (offline)`}
            </div>
          )}

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
            onChange={(data) => documentLocalSave(localDocument, data)}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localDocument.chapters!.map((chapter, chIndex) => (
            <Chapter
              key={chapter.id} 
              chapter={chapter}
              onChange={chapterLocalSave}
              setUpdate={setChaptersSideMenu}
              onSubtitleTab={() => onSubtitleTab(localDocument.chapters ?? [], chIndex, chapter.paragraphs ?? [], setActiveParagraph)}
            >
              {chapter.paragraphs!.map((paragraph, pIndex) => (
                  <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    focusActivation={paragraph.id === activeParagraph?.id ? {direction: activeParagraph.direction} : null}
                    navigation={getNavigationAvailability(chIndex, pIndex, localDocument.chapters?.length ?? 0, chapter.paragraphs ?? [])}
                    onTextChange={paragraphLocalSave}
                    onDelete={() => deleteParagraph(localDocument, paragraph.id, setLocalDocument)}
                    onNavigate={(direction) => navigateToAdjacentParagraph(localDocument.chapters, chIndex, pIndex, direction, setActiveParagraph)}
                    createNewParagraphInChapter={() => setShouldAddNewParagraph(chapter)}
                    onRemoteSync={() => {}}
                    onReorder={(direction) => handleReorderParagraphs(chapter.paragraphs, chIndex, pIndex, direction)  }
                    createNewParagraphAbove={() => setShouldAddNewParagraphAbove({chapter, paragraphIndex: pIndex})}
                  />
                ))}
              {/* Add Paragraph Button */}
              <AddButton type="paragraph" onClick={() => setShouldAddNewParagraph(chapter)} />
            </Chapter>
          ))}
          
          {/* Add Chapter Button */}
          <AddButton type="chapter" onClick={() => setShouldAddNewChapter(true)} />
        </main>

        {/* Coluna Lateral Direita */}
        <SideColumn side="right">
          <div className="text-sm text-slate-200">Coluna Direita</div>
        </SideColumn>
      </div>
    </div>
  );
}