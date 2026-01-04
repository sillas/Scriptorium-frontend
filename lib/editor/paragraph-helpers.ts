import { ChapterInterface, ParagraphInterface } from '@/components/editor/types';

/**
 * Handles delete action for a paragraph, prompting for confirmation if it contains text.
 * @param text The text content of the paragraph
 * @param what Optional description of what is being deleted (e.g., 'paragraph')
 * @returns 
 */
export const handleDeleteQuestion = (text: string | undefined, what?: string): boolean => {
    let textLength = text?.trim().length || 0;
    if(textLength && !confirm(`Tem certeza que deseja remover este ${what ?? 'parágrafo'}?`)) return false;
    return true;
}

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