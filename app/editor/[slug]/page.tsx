
import { EditorClient } from '@/components/editor/EditorClient';
import { 
  TextDocumentInterface, 
  ParagraphInterface, 
  ChapterInterface
} from '@/components/editor/interfaces';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug;
  
  // Formata o slug para um título mais legível
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `${title} - Editor`,
    description: `Editing document: ${title}`,
  };
}

export default async function Editor({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug

  // Data Mocks from database
  const mockDocument: TextDocumentInterface = {
    id: 'doc-1',
    title: 'The Art of Programming',
    slug: 'the-art-of-programming',
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

  const mockParagraphs: ParagraphInterface[] = [
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

  const mockChapters: ChapterInterface[] = [
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

  return <EditorClient 
    slug={slug}
    textDocument={mockDocument}
    paragraphs={mockParagraphs}
    chapters={mockChapters}
  />;
}