import { 
  DocumentInterface, 
  ChapterInterface, 
  ParagraphInterface,
  ActiveParagraphInterface
} from '@/components/editor/utils/interfaces';

/**
 * Conta o número de palavras em um texto.
 * @param text 
 * @returns 
 */
export const countWords = (text: string) => {
  return text === '' ? 0 : text.split(/\s+/).length;
}


/**
 * Atualiza o documento local com um capítulo modificado e um novo parágrafo.
 *
 * @param localDocument Documento atual
 * @param chapter Capítulo modificado
 * @param newParagraph Novo parágrafo a ser adicionado
 * @param setLocalDocument Função para atualizar o estado do documento
 * @param setActiveParagraph Função para atualizar o parágrafo ativo
 * @param paragraphLocalSave Função para salvar o parágrafo localmente
 * @returns Promise<boolean> indicando sucesso
 */
export const updateDocumentWithChapter = async (
  localDocument: DocumentInterface,
  chapter: ChapterInterface,
  newParagraph: ParagraphInterface,
  setLocalDocument: (doc: DocumentInterface) => void,
  setActiveParagraph: (active: ActiveParagraphInterface) => void,
  paragraphLocalSave: (paragraph: ParagraphInterface) => Promise<boolean>,
): Promise<boolean> => {
  const result = await paragraphLocalSave(newParagraph);
  if (!result) return false;

  const documentUpdated = { ...localDocument };
  documentUpdated.chapters = documentUpdated.chapters!.map(ch =>
    ch.id === chapter.id ? chapter : ch
  );

  setLocalDocument(documentUpdated);
  setActiveParagraph({
    id: newParagraph.id,
    direction: 'previous'
  });

  return true;
};


/**
 * Reordena parágrafos em um capítulo e atualiza o documento local.
 *
 * @param paragraphs Lista de parágrafos do capítulo
 * @param cIndex Índice do capítulo no documento
 * @param pIndex Índice do parágrafo a ser movido
 * @param direction Direção do movimento ('up' | 'down')
 * @param localDocument Documento atual
 * @param setLocalDocument Função para atualizar o estado do documento
 * @param paragraphLocalSave Função para salvar o parágrafo localmente
 */
export const reorderParagraphs = async (
  paragraphs: ParagraphInterface[],
  cIndex: number,
  pIndex: number,
  direction: 'up' | 'down',
  localDocument: DocumentInterface,
  setLocalDocument: (doc: DocumentInterface) => void,
  paragraphLocalSave: (paragraph: ParagraphInterface) => Promise<boolean>
) => {
  const localParagraphs = paragraphs.map(p => ({ ...p }));
  const targetIndex = direction === 'up' ? pIndex - 1 : pIndex + 1;

  // Check bounds
  if (targetIndex < 0 || targetIndex >= localParagraphs.length) return;

  // Swap indices
  const tempIndex = localParagraphs[pIndex].index;
  localParagraphs[pIndex].index = localParagraphs[targetIndex].index;
  localParagraphs[targetIndex].index = tempIndex;

  // Save changes locally
  const result1 = await paragraphLocalSave({ ...localParagraphs[pIndex] });
  const result2 = await paragraphLocalSave({ ...localParagraphs[targetIndex] });

  if (result1 && result2) {
    // Reorder for visualization
    const reorderedParagraphs = localParagraphs.sort((a, b) => a.index - b.index);

    const documentUpdated = { ...localDocument };
    documentUpdated.chapters![cIndex]!.paragraphs = reorderedParagraphs;

    setLocalDocument(documentUpdated);
    return;
  }

  console.error('Error saving reordered paragraphs');
};


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