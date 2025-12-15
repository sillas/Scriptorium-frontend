'use client';

import { useEffect, useState, useCallback } from 'react';
import Contents from '@/components/editor/editorComponents/Contents';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/columns/SideColumn';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { Title, UpdatedTitleInterface } from '@/components/editor/editorComponents/Title';
import { Paragraph, ParagraphDataInterface } from '@/components/editor/editorComponents/Paragraph';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSync } from '@/hooks/useSync';
import {
  DocumentInterface, 
  ChapterInterface,
  ParagraphInterface,
} from '@/components/editor/utils/interfaces';

interface EditorClientSideProps {
  slug: string;
  theDocument: DocumentInterface;
}

export function EditorClientSide({ slug, theDocument }: EditorClientSideProps) {
  const [localDocument, setLocalDocument] = useState<DocumentInterface>(theDocument);
  const [newChapter, setNewChapter] = useState(false);
  const [newParagraph, setNewParagraph] = useState<ChapterInterface | null>(null);
  
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
    data: UpdatedTitleInterface
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
    data: UpdatedTitleInterface | {} = {},
  ) => {

    const toSave: ChapterInterface = {
      ...chapter,
      ...data,
      sync: false,
    }
    
    if( !(data as UpdatedTitleInterface).updatedAt ) {
      toSave.updatedAt = new Date();
    }
    
    const { paragraphs, ...toSaveLocal } = toSave;
    saveLocal('chapter', toSaveLocal);

  }, [saveLocal]);

  const handleParagraphLocalSave = useCallback((
    paragraph: ParagraphInterface,
    textData: ParagraphDataInterface | null = null,
  ) => {

    const localParagraph: ParagraphInterface = {
      ...paragraph,
      sync: false,
    }

    if( textData !== null) {
      localParagraph.updatedAt = textData.updatedAt;
      localParagraph.text = textData.text; 
    }

    saveLocal('paragraph', localParagraph);    
  }, [saveLocal]);

  const setActiveParagraph = useCallback((
    CurrentParagraphId: string,
    toUp: boolean
  ) => {

    console.log(CurrentParagraphId);

    if( toUp ) {
      console.log('goto up');  
      
      return
    }

    console.log('goto down');
    
  }, []);

  // Add new chapter when newChapter is set
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

      setNewChapter(false);
    }
  }, [newChapter, localDocument.id]);

  // Add new paragraph when newParagraph is set with a chapter
  useEffect(() => {
    if (newParagraph) {

      const documentUpdated = { ...localDocument };
      const thisChapter = {...newParagraph}
      const chapterParagraphs = thisChapter.paragraphs ?? [];
      
      const lastIndex = chapterParagraphs.length > 0
        ? Math.max(...chapterParagraphs.map(p => p.index))
        : 0;
      
      const now = new Date();
      const newParagraphData: ParagraphInterface = {
        id: `temp-${Date.now()}`,
        documentId: localDocument.id,
        chapterId: thisChapter.id,
        index: lastIndex + 1,
        text: "Insert your text here",
        createdAt: now,
        updatedAt: now,
        version: 1,
        characterCount: 0,
        wordCount: 0,
        sync: false,
      };

      thisChapter.paragraphs = [...chapterParagraphs, newParagraphData];
  
      handleParagraphLocalSave(newParagraphData);

      documentUpdated.chapters = documentUpdated.chapters!.map(ch => 
        ch.id === thisChapter.id ? thisChapter : ch
      );

      setLocalDocument(documentUpdated);
      setNewParagraph(null);
    }
  }, [newParagraph, localDocument.id]);

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
            title={localDocument.title}
            subtitle={localDocument.subtitle}
            version={localDocument.version}
            updatedAt={localDocument.updatedAt}
            createdAt={localDocument.createdAt}
            onRemoteSync={() => console.log('onRemoteSync Doc title')}
            onChange={handleDocumentLocalSave}
            isOnline={isOnline}
            isSynced={localDocument.sync}
            isDocumentTitle={true}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localDocument.chapters!.map((chapter) => (
            <Chapter key={chapter.id} id={chapter.id}>
              <Title
                title={chapter.title === '' ? 'Insert a Title' : chapter.title}
                subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
                onRemoteSync={() => console.log('onRemoteSync chapter title')}
                onChange={ data => handleChapterLocalSave(chapter, data) }
                isSynced={chapter.sync}
                isOnline={isOnline}
                isDocumentTitle={false}
                version={chapter.version}
                createdAt={chapter.createdAt}
                updatedAt={chapter.updatedAt}
              />
              {chapter.paragraphs!.map((paragraph) => (
                  <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    isOnline={isOnline}
                    isTheFirstParagraph={paragraph.index === chapter.paragraphs![0]?.index}
                    isTheLastParagraph={paragraph.index === chapter.paragraphs!.at(-1)?.index}
                    onChange={(updatedText) => handleParagraphLocalSave(paragraph, updatedText) }
                    onRemoteSync={() => console.log('onRemoteSync paragraph')}
                    setActiveParagraph={setActiveParagraph}
                  />
                ))}
              {/* Add Paragraph Button */}
              <AddButton type="paragraph" onClick={() => setNewParagraph(chapter)} />
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