'use client';

import { useEffect, useState, useCallback } from 'react';
import EditorHeader from '@/components/editor/Header';
import { Title, TitleDataInterface } from '@/components/editor/editorComponents/Title';
import Chapter from '@/components/editor/editorComponents/Chapter';
import Paragraph from '@/components/editor/editorComponents/Paragraph';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import SideColumn from '@/components/editor/columns/SideColumn';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  DocumentInterface, 
  ChapterInterface
  // ParagraphInterface,
} from '@/components/editor/interfaces';
import { useSync } from '@/hooks/useSync';

export function EditorClient({
  slug,
  theDocument
}: {
  slug: string;
  theDocument: DocumentInterface
}) {
  const [localDocument, setLocalDocument] = useState<DocumentInterface>(theDocument);
  const [newChapter, setNewChapter] = useState(false);
  const [newParagraph, setNewParagraph] = useState<string | null>(null);
  
  // Sync hook
  const { saveLocal } = useLocalStorage();
  const { manualSync, isOnline, syncStatus } = useSync();

  // Load unsynced data from IndexedDB on mount
  useEffect(() => {
    loadUnsyncedData(
      theDocument,
      setLocalDocument
    );
  }, [theDocument]);

  // Handle Ctrl+S for manual sync
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.ctrlKey || e.metaKey) && e.key === 's') {
  //       e.preventDefault();
  //       manualSync();
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [manualSync]);

  // handlers
  const handleDocumentLocalSave = useCallback((
    data: TitleDataInterface
  ) => {

    const toSave: DocumentInterface = {
      ...localDocument,
      ...data,
      updatedAt: new Date(),
      sync: false
    }

    const { chapters, ...toSaveLocal } = toSave;
    saveLocal('document', toSaveLocal);
  }, [saveLocal]);

  const handleChapterLocalSave = useCallback((
    chapter: ChapterInterface,
    data: TitleDataInterface | {} = {},
  ) => {

    const toSave: ChapterInterface = {
      ...chapter,
      ...data,
      sync: false,
    }
    
    if( !(data as TitleDataInterface).updatedAt ) {
      toSave.updatedAt = new Date();
    }
    
    const { paragraphs, ...toSaveLocal } = toSave;
    saveLocal('chapter', toSaveLocal);

  }, [saveLocal]);

  // const handleParagraphSync = useCallback((
  //   data: ParagraphInterface, 
  //   isNew: boolean = false
  // ) => {
  //   // saveLocal('paragraph', data, isNew);
  //   console.log('Sync par data: ', data, isNew);
  // }, [saveLocal]);

  // Add new chapter when newChapter is true
  useEffect(() => {
    if (newChapter) {

      const documentUpdated = { ...localDocument };
      const now = new Date();
      const lastIndex = documentUpdated.chapters!.length > 0 
        ? Math.max(...documentUpdated.chapters!.map(ch => ch.index))
        : 0;
      
      const newChapterData: ChapterInterface = {
        id: `temp-${Date.now()}`,
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

      documentUpdated.chapters!.push(newChapterData);
      setLocalDocument(documentUpdated);
      handleChapterLocalSave(newChapterData);

      // saveLocal('chapter', newChapterData, true);
      
      setNewChapter(false);
    }
  }, [newChapter, localDocument.id]);

  // Add new paragraph when newParagraph is set with chapterId
  // useEffect(() => {
  //   if (newParagraph) {

  //     const now = new Date();
  //     const chapterParagraphs = localParagraphs.filter(p => p.chapterId === newParagraph);
  //     const lastIndex = chapterParagraphs.length > 0
  //       ? Math.max(...chapterParagraphs.map(p => p.index))
  //       : 0;
      
  //     const newParagraphData: ParagraphInterface = {
  //       id: `temp-${Date.now()}`,
  //       documentId: localDocument.id,
  //       chapterId: newParagraph,
  //       index: lastIndex + 1,
  //       text: "Insert your text here",
  //       createdAt: now,
  //       updatedAt: now,
  //       version: 1,
  //       metadata: {
  //         characterCount: 0,
  //       },
  //     };
      
  //     setLocalParagraphs([...localParagraphs, newParagraphData]);
      
  //     // Save to IndexedDB and queue for sync when user starts editing
  //     handleParagraphSync(newParagraphData, true);
      
  //     setNewParagraph(null);
  //   }
  // }, [newParagraph, localParagraphs, localDocument.id]);

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
                chapters={localDocument.chapters!.map((ch) => ({
                  id: ch.id,
                  index: ch.index,
                  title: ch.title === '' ? 'Insert a Title' : ch.title,
                }))}
              />
          </div>
        </SideColumn>

        {/* Coluna Central */}
        <main
          className={`bg-slate-200 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
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
            title={localDocument.title}
            subtitle={localDocument.subtitle}
            version={localDocument.version}
            updatedAt={localDocument.updatedAt}
            createdAt={localDocument.createdAt}
            onSync={() => console.log('onSync Doc title')}
            onChange={handleDocumentLocalSave}
            isOnline={isOnline}
            isSynced={localDocument.sync}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localDocument.chapters!.map((chapter) => (
            <Chapter key={chapter.id} id={chapter.id}>
              <Title
                title={chapter.title === '' ? 'Insert a Title' : chapter.title}
                subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
                chapterId={chapter.id}
                onSync={() => console.log('onSync chapter title')}
                onChange={ data => handleChapterLocalSave(chapter, data) }
                isSynced={chapter.sync}
                isOnline={isOnline}
                version={chapter.version}
                createdAt={chapter.createdAt}
                updatedAt={chapter.updatedAt}
              />
              {chapter.paragraphs!
                .map((paragraph) => (
                  <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    onChange={(newText) => console.log('Paragraph changed:', newText) }
                    onSync={() => console.log('onSync paragraph')}
                    isOnline={isOnline}
                  />
                ))}
              {/* Add Paragraph Button */}
              <AddButton type="paragraph" onClick={() => setNewParagraph(chapter.id)} />
            </Chapter>
          ))}
          
          {/* Add Chapter Button */}
          <AddButton type="chapter" onClick={() => setNewChapter(true)} />
        </main>

        {/* Coluna Lateral Direita */}
        <SideColumn side="right">
          <div className="text-sm text-slate-200">Coluna Direita</div>
        </SideColumn>
      </div>
    </div>
  );
}