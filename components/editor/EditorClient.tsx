'use client';

import { useState } from 'react';
import Chapter from '@/components/editor/editorComponents/Chapter';
import Paragraph from '@/components/editor/editorComponents/Paragraph';
import Title from '@/components/editor/editorComponents/Title';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
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

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [newChapter, setNewChapter] = useState(false);

  // Sort and organize data
  const sortedChapters = [...chapters].sort((a, b) => a.index - b.index);
  const getParagraphsByChapter = (chapterId: string) => {
    return paragraphs
      .filter((p) => p.chapterId === chapterId)
      .sort((a, b) => a.index - b.index);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Barra Superior */}
      <header className="w-full h-14 bg-slate-700 flex items-center px-4 z-10">
        <div className="text-white text-sm">Document {slug}</div>
      </header>

      {/* Container Principal */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Coluna Lateral Esquerda */}
        <aside
          className={`bg-slate-600 transition-all duration-300 ease-in-out relative ${
            leftOpen ? 'w-1/4' : 'w-0'
          }`}
        >
          <div className={`h-full overflow-y-auto ${leftOpen ? 'p-4' : 'p-0'}`}>
            {leftOpen && (
              <Contents
                chapters={sortedChapters.map((ch) => ({
                  id: ch.id,
                  index: ch.index,
                  title: ch.title,
                }))}
              />
            )}
          </div>
        </aside>

        {/* Botão Toggle Esquerda */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className={`absolute left-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
            leftOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
          }`}
          style={{ left: leftOpen ? 'calc(25% - 2rem)' : '0' }}
        >
          {leftOpen ? '◀' : '▶'}
        </button>

        {/* Coluna Central */}
        <main
          className={`bg-slate-500 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto`}
        >
          {/* Document Title */}
          <Title
            title={textDocument.title}
            subtitle={textDocument.subtitle}
            documentId={textDocument.id}
            metadata={{
              version: textDocument.version,
              updatedAt: textDocument.updatedAt,
            }}
          />
          
          {/* Chapters with Titles and Paragraphs */}
          {sortedChapters.map((chapter) => (
            <div key={chapter.id} id={`chapter-${chapter.id}`}>
              <Chapter>
                <Title
                  title={chapter.title}
                  subtitle={chapter.subtitle}
                  documentId={chapter.documentId}
                  chapterId={chapter.id}
                  metadata={{
                    version: chapter.version,
                    updatedAt: chapter.updatedAt,
                  }}
                />
                {getParagraphsByChapter(chapter.id).map((paragraph) => (
                  <Paragraph key={paragraph.id}>
                    {paragraph.text}
                  </Paragraph>
                ))}
                {/* Add Paragraph Button */}
                <AddButton type="paragraph" />
              </Chapter>
            </div>
          ))}
          
          {/* Add Chapter Button */}
          <AddButton type="chapter" onClick={() => setNewChapter(true)} />
        </main>

        {/* Botão Toggle Direita */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={`absolute right-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
            rightOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
          }`}
          style={{ right: rightOpen ? 'calc(25% - 2rem)' : '0' }}
        >
          {rightOpen ? '▶' : '◀'}
        </button>

        {/* Coluna Lateral Direita */}
        <aside
          className={`bg-slate-600 transition-all duration-300 ease-in-out relative ${
            rightOpen ? 'w-1/4' : 'w-0'
          }`}
        >
          <div className={`h-full ${rightOpen ? 'pl-6 pt-4' : 'p-0'}`}>
            {rightOpen && <div className="text-sm text-slate-200">Coluna Direita</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}