'use client';

import { useEffect, useState, useCallback } from 'react';
import Contents from '@/components/editor/editorComponents/Contents';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/columns/SideColumn';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { Title, UpdatedTitleInterface } from '@/components/editor/editorComponents/Title';
import { Paragraph, ParagraphUpdate, NavigationDirection } from '@/components/editor/editorComponents/Paragraph';
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
  const [activeParagraph, setActiveParagraph] = useState<{ id: string; direction: NavigationDirection } | null>(null);
  
  // Sync hook
  const { saveLocal, deleteLocal } = useLocalStorage();
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
    textData: ParagraphUpdate | null = null,
  ) => {

    const localParagraph: ParagraphInterface = {
      ...paragraph,
      sync: false,
    }

    if( textData !== null) {
      localParagraph.updatedAt = textData.updatedAt;
      localParagraph.text = textData.text;
      localParagraph.wordCount = textData.wordCount ?? 0;
      localParagraph.characterCount = textData.characterCount ?? 0;
      localParagraph.isQuote = textData.isQuote ?? false;
    }

    saveLocal('paragraph', localParagraph);    
  }, [saveLocal]);

  const setNextParagraph = useCallback((
    chapterIndex: number,
    paragraphIndex: number,
    direction: NavigationDirection
  ) => {

    if( direction === null ) {
      setActiveParagraph(null);
      return;
    }

    if( direction === 'previous' ) {
      paragraphIndex -= 1;

      if( paragraphIndex < 0 && chapterIndex === 0 ) {
        setActiveParagraph(null);
        return;
      }
    }
    else paragraphIndex += 1;
    const paragraphLength = localDocument.chapters![chapterIndex].paragraphs!.length;

    if(paragraphIndex >= paragraphLength) {
      chapterIndex++;
      paragraphIndex = 0;
    }

    if(paragraphIndex < 0) {
      chapterIndex--;
      const previousChapter = localDocument.chapters![chapterIndex];
      paragraphIndex = previousChapter.paragraphs!.length -1;
    }

    const currentChapter = localDocument.chapters![chapterIndex];
    
    if(currentChapter.paragraphs!.length === 0) {
      setActiveParagraph(null)
      return
    }

    setActiveParagraph({
      id: currentChapter.paragraphs![paragraphIndex].id,
      direction
    });

  }, [localDocument.chapters]);


  const handleDeleteParagraph = useCallback(async (paragraphId: string) => {
    const documentUpdated = { ...localDocument };
    
    documentUpdated.chapters = documentUpdated.chapters!.map(chapter => ({
      ...chapter,
      paragraphs: chapter.paragraphs!.filter(p => p.id !== paragraphId)
    }));

    setLocalDocument(documentUpdated);
    // setActiveParagraph(null);
    
    await deleteLocal('paragraph', paragraphId);
  }, [localDocument, deleteLocal]);

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
        text: '',
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
      setActiveParagraph({
        id: newParagraphData.id,
        direction: 'previous'
      });
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
            isDocumentTitle={true}
            title={localDocument.title}
            subtitle={localDocument.subtitle}
            version={localDocument.version}
            updatedAt={localDocument.updatedAt}
            createdAt={localDocument.createdAt}
            isSynced={localDocument.sync}
            onRemoteSync={() => {}}
            onChange={handleDocumentLocalSave}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localDocument.chapters!.map((chapter, chIndex) => (
            <Chapter
              key={chapter.id} 
              chapter={chapter}
              onChange={handleChapterLocalSave}
            >
              {chapter.paragraphs!.map((paragraph, pIndex) => (
                  <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    isOnline={isOnline}
                    navigation={{
                      canNavigatePrevious: !(chIndex === 0 && pIndex === 0),
                      canNavigateNext: !(chIndex === localDocument.chapters!.length -1 && pIndex === chapter.paragraphs!.length -1),
                      isTheLastParagraphInChapter: pIndex === chapter.paragraphs!.length -1,
                    }}
                    onTextChange={(updatedText) => handleParagraphLocalSave(paragraph, updatedText) }
                    onRemoteSync={() => {}}
                    focusActivation={paragraph.id === activeParagraph?.id ? {direction: activeParagraph.direction} : null}
                    onNavigate={(direction) => setNextParagraph(chIndex, pIndex, direction)}
                    createNewParagraphInChapter={() => setNewParagraph(chapter)}
                    onDelete={() => handleDeleteParagraph(paragraph.id)}
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