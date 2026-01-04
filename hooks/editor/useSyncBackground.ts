import { useCallback, useRef } from 'react';
import { getUnsyncedItemsForDocument } from '@/lib/indexedDB';
import { ChapterInterface, ParagraphInterface } from '@/components/editor/types';
import { syncChapters, syncParagraphs } from '@/lib/sync';


interface SyncAllItemsResult {
  syncedChapters?: ChapterInterface[];
  syncedParagraphs?: ParagraphInterface[];
}

/**
 * Hook para sincronização em background de itens do IndexedDB com o MongoDB
 */
export function useSyncBackground() {
  const isSyncingRef = useRef(false);
  /**
   * Sincroniza capítulos e parágrafos não sincronizados do IndexedDB para o MongoDB
   * 
   * Fluxo:
   * 1. Obtém todos os capítulos e parágrafos com sync=false do IndexedDB para o documento especificado
   * 2. Sincroniza cada capítulo usando a função genérica syncItem:
   *    - Para IDs temporários (começam com "temp-"), envia POST e MongoDB gera novo ID
   *    - Para IDs permanentes, envia PUT para atualização
   *    - Atualiza o item no IndexedDB com sync=true e novo ID (se aplicável)
   * 3. Atualiza referências de chapterId em parágrafos quando o ID do capítulo mudou
   * 4. Sincroniza cada parágrafo (com referências atualizadas) usando syncItem
   * 5. Retorna os itens sincronizados para atualização do estado da aplicação
   * 
   * @param documentId - ID do documento cujos itens serão sincronizados
   * @returns Objeto contendo arrays de capítulos e parágrafos sincronizados com sync=true
   */
  const syncAllItems = useCallback(async (documentId: string): Promise<SyncAllItemsResult> => {
    // Prevenir múltiplas sincronizações simultâneas
    if (isSyncingRef.current) {
      console.log('⏳ Sincronização já em andamento, aguarde...');
      return {};
    }

    isSyncingRef.current = true;

    try {
      const unsyncedData = await getUnsyncedItemsForDocument(documentId.toString());
      const unsyncedChapters = unsyncedData.chapters
      const unsyncedParagraphs = unsyncedData.paragraphs
      // const unsyncedDocument = unsyncedData.document

      const syncedChapters = await syncChapters(unsyncedChapters, unsyncedParagraphs);
      const syncedParagraphs = await syncParagraphs(unsyncedParagraphs);
      
      return {syncedChapters, syncedParagraphs};

    } catch (error) {
      console.error('❌ Erro geral na sincronização de capítulos:', error);
      return {};
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  return {
    syncAllItems,
    isSyncing: isSyncingRef.current,
  };
}
