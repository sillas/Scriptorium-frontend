import { ChapterInterface, ParagraphInterface } from '@/components/editor/types';
import { saveToIndexedDB, replaceItem } from '@/lib/indexedDB';

type SyncableItem = ChapterInterface | ParagraphInterface;

/**
 * Função genérica para sincronizar itens (capítulos ou parágrafos) com o MongoDB
 * 
 * @param item - Item a ser sincronizado (capítulo ou parágrafo)
 * @param apiEndpoint - Endpoint da API (/api/chapters ou /api/paragraphs)
 * @param storeName - Nome da store no IndexedDB ('chapters' ou 'paragraphs')
 * @param itemType - Tipo do item para mensagens de log ('capítulo' ou 'parágrafo')
 * @returns Tupla com [item sincronizado, ID anterior se foi alterado]
 */
const syncItem = async <T extends SyncableItem>(
  item: T,
  storeName: 'chapters' | 'paragraphs',
): Promise<T> => {
  const previousId = item.id;
  const isTemp = previousId.startsWith('temp-');

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
  
  console.log(`✅ ${storeName} salvo no MongoDB com ID: ${savedId}`);

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
  console.log(`✅ ${storeName} ${savedId} sincronizado com sucesso`);

  return syncedItem;
};

export const syncChapters = async (
  unsyncedChapters: ChapterInterface[], 
  unsyncedParagraphs: ParagraphInterface[]
): Promise<ChapterInterface[]> => {

  if(unsyncedChapters.length === 0) {
    console.log('ℹ️ Nenhum capítulo para sincronizar.');
    return [];
  }

  console.log(`🔄 Sincronizando ${unsyncedChapters.length} capítulo(s)...`);
  const syncedChapters: ChapterInterface[] = [];
  for (const chapter of unsyncedChapters) {
    try {
      const syncedChapter = await syncItem(chapter, 'chapters');
      syncedChapters.push(syncedChapter);
      const previousId = syncedChapter.previousId;
      // Se o ID mudou, atualizar referências em parágrafos (se necessário)
      if (syncedChapter.id !== previousId && unsyncedParagraphs.length > 0) {
        console.log(`🔄 Atualizar referências de parágrafos do capítulo ${previousId} para ${syncedChapter.id}`);
        
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

  console.log(`✅ Sincronização de capítulos concluída: ${syncedChapters.length}/${unsyncedChapters.length} capítulo(s) sincronizados`);
  
  return syncedChapters;
}

export const syncParagraphs = async (unsyncedParagraphs: ParagraphInterface[]): Promise<ParagraphInterface[]> => {
  if(unsyncedParagraphs.length === 0) {
    console.log('ℹ️ Nenhum parágrafo para sincronizar.');
    return [];
  }

  console.log(`🔄 Sincronizando ${unsyncedParagraphs.length} parágrafo(s)...`);
  const syncedParagraphs: ParagraphInterface[] = [];

  for (const paragraph of unsyncedParagraphs) {
    try {
      const syncedParagraph = await syncItem(paragraph, 'paragraphs');
      syncedParagraphs.push(syncedParagraph);
    } catch (error) {
      console.error(`❌ Erro ao sincronizar parágrafo ${paragraph.id}:`, error);
    }
  }
  console.log(`✅ Sincronização de parágrafos concluída: ${syncedParagraphs.length}/${unsyncedParagraphs.length} parágrafo(s) sincronizados`);
  return syncedParagraphs;
}
