export interface ParagraphInterface {
  id: string;
  documentId: string;
  chapterId: string;
  index: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  sync: boolean;
  metadata?: {
    characterCount?: number;
    author?: string;
  };
}
export interface ChapterInterface {
  id: string;
  documentId: string;
  index: number;
  title: string;
  paragraphs: ParagraphInterface[];
  subtitle: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  sync: boolean;
  metadata?: {
    wordCount?: number;
  };
}

export interface DocumentInterface {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  sync: boolean;
  chapters: ChapterInterface[];
  metadata?: {
    tags?: string[];
    status?: 'draft' | 'active' | 'archived';
  };
}

export interface MongoDocumentInterface {
  _id: any;
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    tags?: string[];
    status?: "draft" | "active" | "archived";
  };
}

export interface MongoChapterInterface {
  _id: string;
  index: number;
  documentId: string;
  title: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    wordCount: number;
  };
}

export interface MongoParagraphInterface {
  _id: string;
  documentId: string;
  chapterId: string;
  index: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    characterCount: number
  };
}
