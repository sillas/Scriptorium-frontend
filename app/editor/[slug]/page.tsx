import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/app/lib/mongodb';
import { EditorClient } from '@/components/editor/EditorClient';
import { 
  convertMongoDocument,
  convertMongoChapters,
  convertMongoParagraphs
} from '@/components/editor/conversions';


export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  
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

  const { slug } = await params;
  const db = await getDatabase();

  // Fetch main document
  const mongoDocument = await db.collection('documents')
    .findOne({ slug })

  if (!mongoDocument) {
    notFound();
  }

  // Fetch related chapters and paragraphs
  const [mongoChapters, mongoParagraphs] = await Promise.all([
      db.collection('chapters')
        .find({documentId: mongoDocument._id})
        .sort({ index: 1 }).toArray(),
      db.collection('paragraphs')
        .find({documentId: mongoDocument._id})
        .sort({ index: 1 }).toArray()
  ]);

  // Convert MongoDB documents to application interfaces
  const document = convertMongoDocument(mongoDocument)
  const chapters = convertMongoChapters(mongoChapters)
  const paragraphs = convertMongoParagraphs(mongoParagraphs)
  

  return <EditorClient 
    slug={slug}
    textDocument={document}
    chapters={chapters}
    paragraphs={paragraphs}
  />;
}