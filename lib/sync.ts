import { ChapterInterface, ParagraphInterface, ContentEntity, DocumentEntity, DocumentEntityType, ContentEntityType, DocumentInterface } from '@/components/editor/types';
import { saveToIndexedDB, replaceItem, deleteFromIndexedDB } from '@/lib/indexedDB';
import { myersDiff } from '@/lib/editor/myersDiff';

/**
 * Deleta um item do MongoDB e do IndexedDB
 * 
 * @param item - Item a ser deletado
 * @param storeName - Nome da store no IndexedDB ('chapters' ou 'paragraphs')
 */
const deleteItem = async <T extends ContentEntity>(
  item: T,
  storeName: 'chapters' | 'paragraphs',
): Promise<void> => {
  // Deletar do MongoDB
  const response = await fetch(`/api/${storeName}/${item.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao deletar ${storeName} ${item.id}: ${error.error || response.statusText}`);
  }

  // Remover do IndexedDB
  await deleteFromIndexedDB(storeName, item.id);
};

/**
 * Função genérica para sincronizar itens (capítulos ou parágrafos) com o MongoDB
 * 
 * @param item - Item a ser sincronizado (capítulo ou parágrafo)
 * @param apiEndpoint - Endpoint da API (/api/chapters ou /api/paragraphs)
 * @param storeName - Nome da store no IndexedDB ('chapters' ou 'paragraphs')
 * @param itemType - Tipo do item para mensagens de log ('capítulo' ou 'parágrafo')
 * @returns Tupla com [item sincronizado, ID anterior se foi alterado]
 */
const syncItem = async <T extends DocumentEntity>(
  item: T,
  storeName: DocumentEntityType,
): Promise<T | null> => {
  const previousId = item.id;
  const isTemp = previousId.startsWith('temp-');

  // Se o item está marcado para deleção, remover do MongoDB e IndexedDB
  if ((item as any).deleted) {
    await deleteItem(item as ContentEntity, storeName as ContentEntityType);
    return null;
  }

  // Preparar dados para envio ao MongoDB
  const { id, ...itemData }: any = { ...item };
  
  // Apenas incluir ID se não for temporário
  if (!isTemp) {
    itemData.id = item.id;
  }

  // Salvar/atualizar no MongoDB
  const response = await fetch(`/api/${storeName}`, {
    method: isTemp ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao sincronizar ${storeName} ${item.id}: ${error.error || response.statusText}`);
  }

  const result = await response.json();
  
  // Se foi um POST, o servidor retorna o novo ObjectId gerado pelo MongoDB
  const savedId = isTemp ? result.id : item.id;
  
  // Criar item atualizado
  const syncedItem: T = {
    ...item,
    id: savedId,
    previousId,
    sync: true,
  } as T;

  // Atualizar no IndexedDB
  if (isTemp) {
    await replaceItem(storeName, previousId, syncedItem);
  } else {
    await saveToIndexedDB(storeName, syncedItem);
  }
  return syncedItem;
};

export const syncDocument = async (
  unsyncedDocument: DocumentInterface
): Promise<DocumentInterface | null> => {
  if(!unsyncedDocument) return null;
  if(unsyncedDocument.title.trim().length === 0 ) return null; // Skip empty titles
  const syncedDocument = await syncItem(unsyncedDocument, 'documents');
  if(syncedDocument === null) return null;
  return syncedDocument
}

export const syncChapters = async (
  unsyncedChapters: ChapterInterface[], 
  unsyncedParagraphs: ParagraphInterface[]
): Promise<ChapterInterface[]> => {

  if(unsyncedChapters.length === 0) return [];

  const syncedChapters: ChapterInterface[] = [];
  for (const chapter of unsyncedChapters) {
    if (chapter.title.trim().length === 0 ) continue; // Skip empty titles
    try {
      const syncedChapter = await syncItem(chapter, 'chapters');
      if(syncedChapter === null) continue; // Capítulo deletado
      syncedChapters.push(syncedChapter);
      
      const previousId = syncedChapter.previousId;
      // Se o ID mudou, atualizar referências em parágrafos (se necessário)
      if (syncedChapter.id !== previousId && unsyncedParagraphs.length > 0) {

        unsyncedParagraphs.forEach(p => {
          if (p.chapterId === previousId) {
            p.chapterId = syncedChapter.id;
          }
        });
      }
    } catch (error) {
      console.error(`❌ Erro ao sincronizar capítulo ${chapter.id}:`, error);
    }
  }

  return syncedChapters;
}

export const syncParagraphs = async (
  currentParagraphs: ParagraphInterface[],
  unsyncedParagraphs: ParagraphInterface[]
): Promise<ParagraphInterface[]> => {
  if(unsyncedParagraphs.length === 0) {
    return [];
  }

  const syncedParagraphs: ParagraphInterface[] = [];

  for (const paragraph of unsyncedParagraphs) {
    try {
      // --------------------------
      const original = currentParagraphs[paragraph.index]?.text.split(' ') || [];
      const current = paragraph.text.split(' ');

      if(original.length === 1 && original[0] === '') original.pop();

      const diff = myersDiff(original, current);
      console.log(diff);
      
      /*
        TODO: Store diffs in MongoDB and IndexedDB for future use.
        Use the diffs to implement version history.
        --------------------------
        Use 24h timestamps to limit history size by merge all diffs in 
        period to create a diff-version snapshot.

        Steps: 
        1 - Get all diffs older than 24h and version number different then null (current version).
        2 - merge them to create a big snapshot diff.
        3 - store the snapshot as a new version.
        4 - clear the null-version diffs from the database.
            keep only null-diffs after the snapshot.

        # - If the version number is to big, we can also create a snapshot.
        # - If the number of diffs is to big, we can also create a snapshot.

        # - Older snapshots can be deleted after some time:
        Steps:
        1 - Get all snapshot-diffs older than X days.
        2 - Create the new base text by applying the snapshot diffs to the original text.
        3 - Store the new base text as the new original text with the last snapshot version.
        4 - Delete all diffs used here from database.

        # New paragraphs are stored as full text with version=null (the base text).
        # Deleted paragraphs are marked as soft-deleted to preserve history.
        
        Example of diff data structure:
        {
          id: string,
          documentId: string,
          chapterId: string | null,
          paragraphId: string | null,
          version: number | null, // Create indexed on this field too.
          diffs: Array<{operation: '+' | '-', position: number, content?: string}>,
          createdAt: Date
        }

        diffs structure explanation:
        - operation: '+' for insertions, '-' for deletions
        - position: index in the original text where the operation occurs
        - content: text to be inserted (only for '+' operations)
        obs.: diffs cam be stored as linear CSV string to save space if needed.
        Ex.: "+,0,Hello;-,5" means insert "Hello" at position 0 and delete word at position 5.
      */
      // --------------------------

      const syncedParagraph = await syncItem(paragraph, 'paragraphs');
      if(syncedParagraph === null) continue; // Parágrafo deletado
      syncedParagraphs.push(syncedParagraph);

    } catch (error) {
      console.error(`❌ Erro ao sincronizar parágrafo ${paragraph.id}:`, error);
    }
  }
  return syncedParagraphs;
}
