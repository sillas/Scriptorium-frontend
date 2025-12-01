import { 
  TextDocumentInterface, 
  ParagraphInterface, 
  ChapterInterface
} from '@/components/editor/interfaces';

export function convertMongoDocument(mongoDoc: any): TextDocumentInterface {
    return {
        id: mongoDoc._id.toString(),
        title: mongoDoc.title,
        slug: mongoDoc.slug,
        subtitle: mongoDoc.subtitle || '',
        author: mongoDoc.author,
        createdAt: new Date(mongoDoc.createdAt),
        updatedAt: new Date(mongoDoc.updatedAt),
        version: mongoDoc.version,
        metadata: {
        tags: mongoDoc.metadata?.tags || [],
        status: mongoDoc.metadata?.status || 'draft',
        },
    };
}

export function convertMongoChapters(mongoChapters: any[]): ChapterInterface[] {
  return mongoChapters.map((chapter) => ({
    id: chapter._id.toString(),
    index: chapter.index,
    documentId: chapter.documentId.toString(),
    title: chapter.title,
    subtitle: chapter.subtitle || '',
    createdAt: new Date(chapter.createdAt),
    updatedAt: new Date(chapter.updatedAt),
    version: chapter.version,
    metadata: {
      wordCount: chapter.metadata?.wordCount || 0,
    },
  }));
}

export function convertMongoParagraphs(mongoParagraphs: any[]): ParagraphInterface[] {
  return mongoParagraphs.map((paragraph) => ({
    id: paragraph._id.toString(),
    documentId: paragraph.documentId.toString(),
    chapterId: paragraph.chapterId.toString(),
    index: paragraph.index,
    text: paragraph.text,
    createdAt: new Date(paragraph.createdAt),
    updatedAt: new Date(paragraph.updatedAt),
    version: paragraph.version,
    metadata: {
      characterCount: paragraph.metadata?.characterCount || 0,
      author: paragraph.metadata?.author || 'No Author',
    },
  }));
}