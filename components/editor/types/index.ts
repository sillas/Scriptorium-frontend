export type textAlignmentType = 'text-justify'| 'text-right'|'text-left'|'text-center';
export type FormatTag = 'strong' | 'i' | 'u';

export interface ParagraphUpdate {
  text: string;
  characterCount: number;
  wordCount: number;
  isQuote: boolean;
  isHighlighted: boolean;
  textAlignment: textAlignmentType;
  updatedAt?: Date;
}
export interface ParagraphInterface {
  id: string;
  previousId?: string;
  documentId: string;
  chapterId: string;
  index: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  sync: boolean;
  characterCount: number;
  wordCount: number;
  isQuote?: boolean;
  isHighlighted?: boolean;
  textAlignment?: textAlignmentType;
}
export interface ChapterInterface {
  id: string;
  previousId?: string;
  documentId: string;
  index: number;
  title: string;
  subtitle: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  sync: boolean;
  wordCount?: number;
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
  fontClass?: string;
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
  wordCount: number;
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
  characterCount: number;
  wordCount: number;
}

export interface ActiveParagraphInterface {
  id: string;
  direction: NavigationDirection;
}

export type NavigationDirection = 'Up' | 'Down' | null;
export type DocumentComponentsItems = ParagraphInterface | ChapterInterface;
export type DocumentComponentsItemsType = 'paragraph' | 'chapter';