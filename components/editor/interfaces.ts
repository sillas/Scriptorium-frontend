export interface TextDocumentInterface {
  id: string;
  title: string;
  slug: string;
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

export interface ChapterInterface {
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

export interface ParagraphInterface {
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