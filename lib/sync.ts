import { ChapterInterface, ParagraphInterface, ContentEntity } from '@/components/editor/types';
import { saveToIndexedDB, replaceItem, deleteFromIndexedDB } from '@/lib/indexedDB';

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
const syncItem = async <T extends ContentEntity>(
  item: T,
  storeName: 'chapters' | 'paragraphs',
): Promise<T | null> => {
  const previousId = item.id;
  const isTemp = previousId.startsWith('temp-');

  // Se o item está marcado para deleção, remover do MongoDB e IndexedDB
  if ((item as any).deleted) {
    await deleteItem(item, storeName);
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

export const syncChapters = async (
  unsyncedChapters: ChapterInterface[], 
  unsyncedParagraphs: ParagraphInterface[]
): Promise<ChapterInterface[]> => {

  if(unsyncedChapters.length === 0) {
    return [];
  }

  const syncedChapters: ChapterInterface[] = [];
  for (const chapter of unsyncedChapters) {
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

export const syncParagraphs = async (unsyncedParagraphs: ParagraphInterface[]): Promise<ParagraphInterface[]> => {
  if(unsyncedParagraphs.length === 0) {
    return [];
  }

  const syncedParagraphs: ParagraphInterface[] = [];

  for (const paragraph of unsyncedParagraphs) {
    try {
      const syncedParagraph = await syncItem(paragraph, 'paragraphs');
      if(syncedParagraph === null) continue; // Parágrafo deletado
      syncedParagraphs.push(syncedParagraph);
    } catch (error) {
      console.error(`❌ Erro ao sincronizar parágrafo ${paragraph.id}:`, error);
    }
  }
  return syncedParagraphs;
}
