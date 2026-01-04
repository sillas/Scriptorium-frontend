import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { ClientEditor } from '@/components/editor/clientEditor';
import { 
  convertMongoDocument,
  convertMongoChapters,
  convertMongoParagraphs
} from '@/lib/editor/conversions';
import { 
  MongoChapterInterface, 
  MongoDocumentInterface, 
  MongoParagraphInterface 
} from '@/components/editor/types';

interface EditorProps {
  params: Promise<{ id: string }>
}

// Database collection names
const COLLECTIONS = {
  DOCUMENTS: 'documents',
  CHAPTERS: 'chapters',
  PARAGRAPHS: 'paragraphs',
} as const;

/**
 * Server component for the document editor page
 * Fetches document data from MongoDB and renders the editor client
 */
export default async function Editor({ params }: EditorProps) {
  const { id } = await params;
  const db = await getDatabase();

  // Fetch main document
  let mongoDocument = null;
  
  try {
    mongoDocument = await db
      .collection(COLLECTIONS.DOCUMENTS)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Erro ao buscar o documento:', error);
    notFound();
  }

  if (!mongoDocument) notFound();

  // Fetch related chapters and paragraphs in parallel for better performance
  const [mongoChapters, mongoParagraphs] = await Promise.all([
    db.collection(COLLECTIONS.CHAPTERS)
      .find({ documentId: id })
      .sort({ index: 1 })
      .toArray(),
    db.collection(COLLECTIONS.PARAGRAPHS)
      .find({ documentId: id })
      .sort({ index: 1 })
      .toArray(),
  ]);

  // Convert MongoDB documents to application interfaces
  // Order matters: paragraphs first, then chapters, then document
  const paragraphs = convertMongoParagraphs(
    mongoParagraphs as unknown as MongoParagraphInterface[]
  );
  
  const chapters = convertMongoChapters(
    mongoChapters as unknown as MongoChapterInterface[]
  );

  const document = convertMongoDocument(
    mongoDocument as unknown as MongoDocumentInterface
  );
  
  return (
    <ClientEditor 
      initialDocument={document}
      chapters={chapters}
      paragraphs={paragraphs}
    />
  );
}