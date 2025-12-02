'use client';

import { useEffect, useState } from 'react';
import EditorHeader from '@/components/editor/Header';
import Chapter from '@/components/editor/editorComponents/Chapter';
import Paragraph from '@/components/editor/editorComponents/Paragraph';
import Title from '@/components/editor/editorComponents/Title';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import { SideColumn } from '@/components/editor/columns/SideColumn';
import {
  TextDocumentInterface, 
  ParagraphInterface,
  ChapterInterface
} from '@/components/editor/interfaces';

export function EditorClient({
  slug,
  textDocument,
  paragraphs,
  chapters,
}: {
  slug: string;
  textDocument: TextDocumentInterface,
  chapters: ChapterInterface[],
  paragraphs: ParagraphInterface[],
}) {
  const [newChapter, setNewChapter] = useState(false);
  const [newParagraph, setNewParagraph] = useState<string | null>(null);
  const [localChapters, setLocalChapters] = useState<ChapterInterface[]>(chapters);
  const [localParagraphs, setLocalParagraphs] = useState<ParagraphInterface[]>(paragraphs);

  // Add new chapter when newChapter is true
  useEffect(() => {
    if (newChapter) {
      const now = new Date();
      const lastIndex = localChapters.length > 0 
        ? Math.max(...localChapters.map(ch => ch.index))
        : 0;
      
      const newChapterData: ChapterInterface = {
        id: `temp-${Date.now()}`,
        documentId: textDocument.id,
        index: lastIndex + 1,
        title: "Insert a Title",
        subtitle: "Add a subtitle",
        createdAt: now,
        updatedAt: now,
        version: 1,
        metadata: {
          wordCount: 0,
        },
      };
      
      setLocalChapters([...localChapters, newChapterData]);
      setNewChapter(false);
    }
  }, [newChapter, localChapters, textDocument.id]);

  // Add new paragraph when newParagraph is set with chapterId
  useEffect(() => {
    if (newParagraph) {
      const now = new Date();
      const chapterParagraphs = localParagraphs.filter(p => p.chapterId === newParagraph);
      const lastIndex = chapterParagraphs.length > 0
        ? Math.max(...chapterParagraphs.map(p => p.index))
        : 0;
      
      const newParagraphData: ParagraphInterface = {
        id: `temp-${Date.now()}`,
        documentId: textDocument.id,
        chapterId: newParagraph,
        index: lastIndex + 1,
        text: "Insert your text here",
        createdAt: now,
        updatedAt: now,
        version: 1,
        metadata: {
          characterCount: 0,
        },
      };
      
      setLocalParagraphs([...localParagraphs, newParagraphData]);
      setNewParagraph(null);
    }
  }, [newParagraph, localParagraphs, textDocument.id]);

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
                chapters={localChapters.map((ch) => ({
                  id: ch.id,
                  index: ch.index,
                  title: ch.title,
                }))}
              />
          </div>
        </SideColumn>

        {/* Coluna Central */}
        <main
          className={`bg-slate-500 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
        >
          {/* Document Title */}
          <Title
            title={textDocument.title}
            subtitle={textDocument.subtitle}
            // documentId={textDocument.id}
            metadata={{
              version: textDocument.version,
              updatedAt: textDocument.updatedAt,
            }}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {localChapters.map((chapter) => (
            <div key={chapter.id} id={`chapter-${chapter.id}`}>
              <Chapter>
                <Title
                  title={chapter.title}
                  subtitle={chapter.subtitle}
                  // documentId={chapter.documentId}
                  chapterId={chapter.id}
                  metadata={{
                    version: chapter.version,
                    updatedAt: chapter.updatedAt,
                  }}
                  onTitleChange={(newTitle) => {
                    setLocalChapters(localChapters.map(ch => 
                      ch.id === chapter.id ? { ...ch, title: newTitle } : ch
                    ));
                  }}
                  onSubtitleChange={(newSubtitle) => {
                    setLocalChapters(localChapters.map(ch => 
                      ch.id === chapter.id ? { ...ch, subtitle: newSubtitle } : ch
                    ));
                  }}
                />
                {localParagraphs
                  .filter(p => p.chapterId === chapter.id)
                  .map((paragraph) => (
                    <Paragraph key={paragraph.id}>
                      {paragraph.text}
                    </Paragraph>
                  ))}
                {/* Add Paragraph Button */}
                {!(() => {
                  const chapterParagraphs = localParagraphs.filter(p => p.chapterId === chapter.id);
                  return chapterParagraphs.length > 0 && chapterParagraphs[chapterParagraphs.length - 1].id.startsWith('temp-');
                })() && (
                  <AddButton type="paragraph" onClick={() => setNewParagraph(chapter.id)} />
                )}
              </Chapter>
            </div>
          ))}
          
          {/* Add Chapter Button */}
          {!(localChapters.length > 0 && localChapters[localChapters.length - 1].id.startsWith('temp-')) && (
            <AddButton type="chapter" onClick={() => setNewChapter(true)} />
          )}
        </main>

        {/* Coluna Lateral Direita */}
        <SideColumn side="right">
          <div className="text-sm text-slate-200">Coluna Direita</div>
        </SideColumn>
      </div>
    </div>
  );
}