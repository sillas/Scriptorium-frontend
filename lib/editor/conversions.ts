import { 
  DocumentInterface, 
  ChapterInterface,
  ParagraphInterface, 
  MongoDocumentInterface,
  MongoChapterInterface,
  MongoParagraphInterface
} from '@/components/editor/types';


export function convertMongoDocument(
  mongoDoc: MongoDocumentInterface
): DocumentInterface {

  return {
        id: mongoDoc._id.toString(),
        title: mongoDoc.title,
        slug: mongoDoc.slug,
        subtitle: mongoDoc.subtitle || '',
        author: mongoDoc.author || '',
        sync: true,
        createdAt: new Date(mongoDoc.createdAt),
        updatedAt: new Date(mongoDoc.updatedAt),
        version: mongoDoc.version,
        tags: mongoDoc?.tags || [],
        status: mongoDoc?.status || 'draft',
    };
}


export function convertMongoChapters(
  mongoChapters: MongoChapterInterface[]
): ChapterInterface[] {

  return mongoChapters.map((chapter) => ({
    id: chapter._id.toString(),
    index: chapter.index,
    documentId: chapter.documentId.toString(),
    title: chapter.title,
    subtitle: chapter.subtitle || '',
    sync: true,
    createdAt: new Date(chapter.createdAt),
    updatedAt: new Date(chapter.updatedAt),
    version: chapter.version,
    wordCount: chapter.wordCount || 0
  }));
}

export function convertMongoParagraphs(
  mongoParagraphs: MongoParagraphInterface[]
): ParagraphInterface[] {

  return mongoParagraphs.map((paragraph) => ({
    id: paragraph._id.toString(),
    documentId: paragraph.documentId.toString(),
    chapterId: paragraph.chapterId.toString(),
    index: paragraph.index,
    text: paragraph.text,
    createdAt: new Date(paragraph.createdAt),
    updatedAt: new Date(paragraph.updatedAt),
    version: paragraph.version,
    sync: true,
    characterCount: paragraph.characterCount || 0,
    wordCount: paragraph.wordCount || 0,
    isQuote: paragraph.isQuote || false,
    isHighlighted: paragraph.isHighlighted || false,
    textAlignment: paragraph.textAlignment || 'text-left',
  }));
}