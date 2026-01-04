import { ChapterInterface, ParagraphInterface } from '@/components/editor/types';


export const updateLocalState = <T extends ParagraphInterface | ChapterInterface>(
  syncedItems: T[] | undefined,
  setLocalItems: React.Dispatch<React.SetStateAction<T[]>>
) => {
  if (!syncedItems || syncedItems.length === 0) return;

  setLocalItems(currentItems => currentItems.map(item => {
    const syncedItem = syncedItems.find(sc => sc.previousId === item.id);
    if( syncedItem ) {
      const { previousId, ...rest } = syncedItem;
      return rest as T;
    }
    return item;
  }));
}

// Helper function to create a new paragraph object
export const createParagraphObject = (
  documentId: string,
  chapterId: string,
  index: number
): ParagraphInterface => {
  const now = new Date();
  return {
    id: `temp-${crypto.randomUUID()}`,
    documentId,
    chapterId,
    index,
    text: '',
    createdAt: now,
    updatedAt: now,
    version: 1,
    characterCount: 0,
    wordCount: 0,
    sync: false,
  };
};