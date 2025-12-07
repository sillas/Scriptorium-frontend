import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/app/lib/mongodb';
import { EditorClient } from '@/components/editor/EditorClient';
import { 
  convertMongoDocument,
  convertMongoChapters,
  convertMongoParagraphs
} from '@/components/editor/conversions';
import { MongoChapterInterface, MongoDocumentInterface, MongoParagraphInterface } from '@/components/editor/interfaces';


/**
 * Generates metadata for the document editor page
 * Converts the slug into a human-readable title for SEO purposes
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const title = formatSlugToTitle(slug);
  
  return {
    title: `${title} - Editor`,
    description: `Editing document: ${title}`,
  };
}

/**
 * Converts a kebab-case slug to Title Case
 * @example "hello-world" -> "Hello World"
 */
function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
export default async function Editor({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const db = await getDatabase();

  // Fetch main document
  const mongoDocument = await db
    .collection(COLLECTIONS.DOCUMENTS)
    .findOne({ slug });

  if (!mongoDocument) {
    notFound();
  }

  // Fetch related chapters and paragraphs in parallel for better performance
  const [mongoChapters, mongoParagraphs] = await Promise.all([
    db.collection(COLLECTIONS.CHAPTERS)
      .find({ documentId: mongoDocument._id })
      .sort({ index: 1 })
      .toArray(),
    db.collection(COLLECTIONS.PARAGRAPHS)
      .find({ documentId: mongoDocument._id })
      .sort({ index: 1 })
      .toArray(),
  ]);

  // Convert MongoDB documents to application interfaces
  // Order matters: paragraphs first, then chapters (which need paragraphs), then document
  const paragraphs = convertMongoParagraphs(
    mongoParagraphs as unknown as MongoParagraphInterface[]
  );
  
  const chapters = convertMongoChapters(
    mongoChapters as unknown as MongoChapterInterface[],
    paragraphs
  );

  const document = convertMongoDocument(
    mongoDocument as unknown as MongoDocumentInterface
  );

  // Attach chapters to document
  document.chapters = chapters;
  
  return (
    <EditorClient 
      slug={slug}
      theDocument={document}
    />
  );
}