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

/** TODO: "getSelectedTextAndPositions"
 * Captura o texto selecionado e as posições de início e fim do cursor dentro de um elemento contentEditable.
 * @param elementRef Referência do elemento contentEditable
 * @returns { text: string, start: number, end: number } ou null se não houver seleção
 */
export function getSelectedTextAndPositions(
  elementRef: React.RefObject<HTMLElement | null>
): { text: string; start: number; end: number } | null {
  const element = elementRef.current;
  if (!element) return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return null;

  // Cria um range do início do elemento até o início da seleção
  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;

  // Cria um range do início do elemento até o fim da seleção
  const preRangeEnd = document.createRange();
  preRangeEnd.selectNodeContents(element);
  preRangeEnd.setEnd(range.endContainer, range.endOffset);
  const end = preRangeEnd.toString().length;

  const text = selection.toString();

  return { text, start, end };
}