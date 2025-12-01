'use client';

import { useState } from 'react';
import Chapter from '@/components/Chapter';
import Paragraph from '@/components/Paragraph';
import Title from '@/components/Title';
import Contents from '@/components/Contents';
import AddButton from '@/components/AddButton';

// Types
interface Document {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata: {
    tags?: string[];
    status?: 'draft' | 'published' | 'archived';
  };
}

interface Chapter {
  id: string;
  documentId: string;
  index: number;
  title: string;
  subtitle: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata: {
    wordCount?: number;
  };
}

interface Paragraph {
  id: string;
  chapterId: string;
  index: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata: {
    characterCount?: number;
    author?: string;
  };
}

// Mock Data
const mockDocument: Document = {
  id: 'doc-1',
  title: 'The Art of Programming',
  subtitle: 'A Journey Through Code and Logic',
  author: 'John Doe',
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-11-30'),
  version: 3,
  metadata: {
    tags: ['programming', 'education', 'technology'],
    status: 'draft',
  },
};

const mockChapters: Chapter[] = [
  {
    id: 'ch-1',
    documentId: 'doc-1',
    index: 0,
    title: 'Introduction to Programming',
    subtitle: 'Understanding the Basics',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-11-28'),
    version: 2,
    metadata: {
      wordCount: 450,
    },
  },
  {
    id: 'ch-2',
    documentId: 'doc-1',
    index: 1,
    title: 'Advanced Concepts',
    subtitle: 'Deep Dive into Algorithms',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-11-29'),
    version: 1,
    metadata: {
      wordCount: 680,
    },
  },
];

const mockParagraphs: Paragraph[] = [
  {
    id: 'p-1',
    chapterId: 'ch-1',
    index: 0,
    text: 'Programming is the art of telling a computer what to do. It requires logical thinking and problem-solving skills.',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-11-25'),
    version: 1,
    metadata: {
      characterCount: 125,
      author: 'John Doe',
    },
  },
  {
    id: 'p-2',
    chapterId: 'ch-1',
    index: 1,
    text: 'Every programming language has its own syntax and rules, but the underlying concepts remain similar across most languages.',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-11-26'),
    version: 2,
    metadata: {
      characterCount: 132,
      author: 'John Doe',
    },
  },
  {
    id: 'p-3',
    chapterId: 'ch-1',
    index: 2,
    text: 'Understanding data structures and algorithms is fundamental to becoming a proficient programmer.',
    createdAt: new Date('2025-01-17'),
    updatedAt: new Date('2025-11-27'),
    version: 1,
    metadata: {
      characterCount: 105,
      author: 'John Doe',
    },
  },
  {
    id: 'p-4',
    chapterId: 'ch-2',
    index: 0,
    text: 'Algorithms are step-by-step procedures for solving problems. They are the building blocks of efficient software.',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-11-28'),
    version: 1,
    metadata: {
      characterCount: 120,
      author: 'John Doe',
    },
  },
  {
    id: 'p-5',
    chapterId: 'ch-2',
    index: 1,
    text: 'Time and space complexity are crucial considerations when designing algorithms for real-world applications.',
    createdAt: new Date('2025-02-02'),
    updatedAt: new Date('2025-11-29'),
    version: 1,
    metadata: {
      characterCount: 115,
      author: 'John Doe',
    },
  },
  {
    id: 'p-6',
    chapterId: 'ch-2',
    index: 2,
    text: 'Mastering common algorithmic patterns like recursion, dynamic programming, and greedy algorithms opens up new problem-solving possibilities.',
    createdAt: new Date('2025-02-03'),
    updatedAt: new Date('2025-11-30'),
    version: 2,
    metadata: {
      characterCount: 150,
      author: 'John Doe',
    },
  },
];

export default function Editor() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Sort and organize data
  const sortedChapters = [...mockChapters].sort((a, b) => a.index - b.index);
  const getParagraphsByChapter = (chapterId: string) => {
    return mockParagraphs
      .filter((p) => p.chapterId === chapterId)
      .sort((a, b) => a.index - b.index);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Barra Superior */}
      <header className="w-full h-14 bg-slate-700 flex items-center px-4 z-10">
        <div className="text-white text-sm">Menu Bar</div>
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
            title={mockDocument.title}
            subtitle={mockDocument.subtitle}
            documentId={mockDocument.id}
            metadata={{
              version: mockDocument.version,
              updatedAt: mockDocument.updatedAt,
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
          <AddButton type="chapter" />
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