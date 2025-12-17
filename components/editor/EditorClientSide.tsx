'use client';

import { useEffect, useState, useCallback } from 'react';
import Contents from '@/components/editor/editorComponents/Contents';
import EditorHeader from '@/components/editor/Header';
import SideColumn from '@/components/editor/columns/SideColumn';
import AddButton from '@/components/editor/editorComponents/AddButton';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { loadUnsyncedData } from '@/lib/loadUnsyncedData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSync } from '@/hooks/useSync';
import { useIsOnline } from '@/components/OnlineStatusProvider';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { 
  Paragraph, 
  ParagraphUpdate, 
  NavigationDirection
} from '@/components/editor/editorComponents/Paragraph';
import {
  DocumentInterface, 
  ChapterInterface,
  ParagraphInterface,
} from '@/components/editor/utils/interfaces';

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
  const [shouldAddNewChapter, setShouldAddNewChapter] = useState(false);
  const [shouldAddNewParagraph, setShouldAddNewParagraph] = useState<ChapterInterface | null>(null);
  const [activeParagraph, setActiveParagraph] = useState<{ id: string; direction: NavigationDirection } | null>(null);
  
  // Sync hook
  const { saveLocal, deleteLocal } = useLocalStorage();
  const { syncStatus } = useSync();
  const isOnline = useIsOnline();

  // Load unsynced data from IndexedDB on mount
  useEffect(() => {
    loadUnsyncedData(
      theDocument,
      setLocalDocument
    );
  }, [theDocument]);


  /**
   * Save partial document data locally (does not include chapters).
   * Marks the document as unsynced and updates the `updatedAt` timestamp.
   * The saved object excludes nested `chapters` to keep local storage compact.
   *
   * @param data - partial document fields to update locally (e.g. title, subtitle)
   */
  const handleDocumentLocalSave = useCallback((
    data: TitleUpdateData
  ):boolean => {

    const toSave: DocumentInterface = {
      ...localDocument,
      ...data,
      updatedAt: new Date(),
      sync: false
    }

    const { chapters, ...toSaveLocal } = toSave;

    try {
      saveLocal('document', toSaveLocal);
      return true;
    } catch (error) {
      console.error('Error saving document locally:', error);
      alert('Erro ao salvar o documento localmente.');
      return false;
    }

  }, [saveLocal, localDocument]);

  /**
   * Save a chapter locally. Marks the chapter as unsynced and updates
   * `updatedAt` unless it was provided in `data`.
   * The saved object excludes `paragraphs` to keep local storage compact.
   *
   * @param chapter - the chapter object to save
   * @param data - optional partial updates to the chapter (e.g. title)
   */
  const handleChapterLocalSave = useCallback((
    chapter: ChapterInterface,
    data: TitleUpdateData | {} = {},
  ): boolean => {

    const toSave: ChapterInterface = {
      ...chapter,
      ...data,
      sync: false,
    }

    // TODO: Add text validation.
    
    if( !(data as TitleUpdateData).updatedAt ) {
      toSave.updatedAt = new Date();
    }
    
    const { paragraphs, ...toSaveLocal } = toSave;

    try {
      saveLocal('chapter', toSaveLocal);
      return true;
    } catch (error) {
      console.error('Error saving chapter locally:', error);
      alert('Erro ao salvar o capítulo localmente.');
      return false;
    }

  }, [saveLocal]);

  /**
   * Save a paragraph locally. If `textData` is provided, updates the
   * paragraph's text, word/character counts and `updatedAt` from it.
   * Marks the paragraph as unsynced.
   *
   * @param paragraph - the paragraph to save
   * @param textData - optional text update information (text, counts, updatedAt)
   */
  const handleParagraphLocalSave = useCallback((
    paragraph: ParagraphInterface,
    textData: ParagraphUpdate | null = null,
  ): boolean => {

    const localParagraph: ParagraphInterface = {
      ...paragraph,
      sync: false,
    }

    // TODO: Add text validation.

    if( textData !== null) {
      localParagraph.updatedAt = textData.updatedAt;
      localParagraph.text = textData.text;
      localParagraph.wordCount = textData.wordCount ?? 0;
      localParagraph.characterCount = textData.characterCount ?? 0;
      localParagraph.isQuote = textData.isQuote ?? false;
    }

    try {
      saveLocal('paragraph', localParagraph);
      return true
    } catch (error) {
      console.error('Error saving paragraph locally:', error);
      alert('Erro ao salvar o parágrafo localmente.');
      return false;
    }

  }, [saveLocal]);

  /**
   * Activate the next or previous paragraph for focus/navigation.
   * Calculates boundaries across chapters and sets `activeParagraph` accordingly.
   * If navigation reaches outside the document bounds, clears the active paragraph.
   *
   * @param chapterIndex - index of the current chapter
   * @param paragraphIndex - index of the current paragraph within the chapter
   * @param direction - 'previous' or 'next' to indicate navigation direction
   */
  const navigateToAdjacentParagraph = useCallback((
    chapterIndex: number,
    paragraphIndex: number,
    direction: NavigationDirection
  ) => {

    const chapters = localDocument.chapters;

    if (!chapters || chapters.length === 0 || direction === null) {
      setActiveParagraph(null);
      return;
    }

    let newChapterIndex = chapterIndex;
    let newParagraphIndex = paragraphIndex;

    if( direction === 'previous' ) {
      newParagraphIndex--;

      if(newParagraphIndex < 0) {
        newChapterIndex--;        
        if( newChapterIndex < 0 || chapters[newChapterIndex].paragraphs!.length === 0 ) {
          setActiveParagraph(null);
          return;
        }
        newParagraphIndex = chapters[newChapterIndex].paragraphs!.length - 1;
      }
    } else if (direction === 'next') {
      newParagraphIndex++;

      const paragraphLength = chapters[newChapterIndex].paragraphs?.length ?? 0;
      if(newParagraphIndex >= paragraphLength) {
        newChapterIndex++;
        if( newChapterIndex >= chapters.length || chapters[newChapterIndex].paragraphs!.length === 0 ) {
          setActiveParagraph(null);
          return;
        }
        newParagraphIndex = 0;
      }
    }

    const targetChapter = chapters[newChapterIndex];
    const targetParagraph = targetChapter?.paragraphs?.[newParagraphIndex];

    if (!targetParagraph) {
      setActiveParagraph(null);
      return;
    }

    setActiveParagraph({
      id: targetParagraph.id,
      direction
    });

  }, [localDocument.chapters]);


  /**
   * Delete a paragraph locally: removes it from the local document state
   * and deletes the unsynced entry from local storage / IndexedDB.
   *
   * @param paragraphId - id of the paragraph to delete
   */
  const handleDeleteParagraph = useCallback(async (paragraphId: string) => {
    const documentUpdated = { ...localDocument };
    
    documentUpdated.chapters = documentUpdated.chapters!.map(chapter => ({
      ...chapter,
      paragraphs: chapter.paragraphs!.filter(p => p.id !== paragraphId)
    }));

    await deleteLocal('paragraph', paragraphId);
    setLocalDocument(documentUpdated);

  }, [localDocument, deleteLocal]);

  // Add new chapter when shouldAddNewChapter is set
  useEffect(() => {
    if (shouldAddNewChapter) {

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
      const result = handleChapterLocalSave(shouldAddNewChapterData);
      if(!result) return;

      setLocalDocument(documentUpdated);
      setShouldAddNewChapter(false);
    }
  }, [
    shouldAddNewChapter, 
    localDocument.id, 
    handleChapterLocalSave
  ]);

  // Add new paragraph when shouldAddNewParagraph is set with a chapter
  useEffect(() => {
    if (!shouldAddNewParagraph) {
      return;
    }

    const documentUpdated = { ...localDocument };
    const thisChapter = {...shouldAddNewParagraph}
    const chapterParagraphs = thisChapter.paragraphs ?? [];
    
    const lastIndex = chapterParagraphs.length > 0
      ? Math.max(...chapterParagraphs.map(p => p.index))
      : 0;
    
    const now = new Date();
    const shouldAddNewParagraphData: ParagraphInterface = {
      id: `temp-${crypto.randomUUID()}`,
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

    thisChapter.paragraphs = [...chapterParagraphs, shouldAddNewParagraphData];

    const result = handleParagraphLocalSave(shouldAddNewParagraphData);
    if(!result) return;

    documentUpdated.chapters = documentUpdated.chapters!.map(ch => 
      ch.id === thisChapter.id ? thisChapter : ch
    );

    setLocalDocument(documentUpdated);
    setShouldAddNewParagraph(null);
    setActiveParagraph({
      id: shouldAddNewParagraphData.id,
      direction: 'previous'
    });

  }, [
    shouldAddNewParagraph, 
    localDocument.id,
    handleParagraphLocalSave
  ]);

  const handleOnSubtitleTab = useCallback((chIndex: number, paragraphs: ParagraphInterface[]) => {
    if (paragraphs.length === 0) {
      return false;
    }
    navigateToAdjacentParagraph(chIndex, -1, 'next');
    return true;
  }, [navigateToAdjacentParagraph]);

  const returnNavigation = useCallback((chIndex: number, pIndex: number, paragraphs: ParagraphInterface[]) => {
    return {
      canNavigatePrevious: !(chIndex === 0 && pIndex === 0),
      canNavigateNext: !(chIndex === localDocument.chapters!.length -1 && pIndex === paragraphs.length -1),
      isTheLastParagraphInChapter: pIndex === paragraphs.length -1,
    }
  }, [localDocument.chapters]);

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
                  title: ch.title === '' ? '#Empty' : ch.title,
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
            isDocumentLevel={true}
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
              onSubtitleTab={() => handleOnSubtitleTab(chIndex, chapter.paragraphs ?? [])}
            >
              {chapter.paragraphs!.map((paragraph, pIndex) => (
                  <Paragraph
                    key={paragraph.id}
                    paragraph={paragraph}
                    focusActivation={paragraph.id === activeParagraph?.id ? {direction: activeParagraph.direction} : null}
                    navigation={returnNavigation(chIndex, pIndex, chapter.paragraphs ?? [])}
                    onTextChange={handleParagraphLocalSave}
                    onDelete={handleDeleteParagraph}
                    onNavigate={(direction) => navigateToAdjacentParagraph(chIndex, pIndex, direction)}
                    createNewParagraphInChapter={() => setShouldAddNewParagraph(chapter)}
                    onRemoteSync={() => {}}
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