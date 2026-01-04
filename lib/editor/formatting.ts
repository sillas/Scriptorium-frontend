import { FormatTag } from '@/components/editor/types';

const removeTagInsideSelection = (selection: Selection, tag: FormatTag, inLoop: boolean = false): boolean => {
  if(selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  let currentNode: Element | null = range.commonAncestorContainer as Element;
  
  // Se for um nó de texto, pega o elemento pai
  if (currentNode.nodeType === Node.TEXT_NODE) {
    currentNode = currentNode.parentElement;
    if (!currentNode) return false;
  }

  const tags = currentNode.querySelectorAll(tag);
  let findTagInsideFlag = false

  for (const inTag of tags) {
    if (range.intersectsNode(inTag)) {
      findTagInsideFlag = true;
      inTag.replaceWith(...inTag.childNodes);
    }
  }

  if(findTagInsideFlag) {
    currentNode.normalize();
    if(!inLoop) selection.removeAllRanges();
    return true;
  }

  return false;
}

const removeTagOutsideSelection = (selection: Selection, tag: FormatTag): boolean => {
  if(selection.rangeCount === 0) return false;
  
  const range = selection.getRangeAt(0);
  let currentNode: Node | null = range.commonAncestorContainer;
  
  // Se for um nó de texto, pega o elemento pai
  if (currentNode.nodeType === Node.TEXT_NODE) {
    currentNode = currentNode.parentElement;
  }
  
  // Procura o elemento de formatação subindo na árvore
  let formatElement: HTMLElement | null = null;
  
  while (currentNode && currentNode !== document.body) {
    if (currentNode instanceof HTMLElement) {
      const tagName = currentNode.tagName.toLowerCase();
      if(tagName === 'div') break; // Não subir além do div container
      if(tagName === tag) {
        formatElement = currentNode;
        break;
      }
    }
    currentNode = currentNode.parentElement;
  }
  
  // Se encontrou o elemento, remove apenas ele
  if (formatElement) {
    formatElement.replaceWith(...formatElement.childNodes);
    formatElement.normalize();
    selection.removeAllRanges();
    return true;
  }
  
  return false;
}

const hasConflictingTags = (selection: Selection, tag: FormatTag): boolean => {

  if(selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        return (tagName === 'strong' || tagName === 'i' || tagName === 'u') && tagName !== tag
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node;
  
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    
    // Cria um range para o elemento encontrado
    const elementRange = document.createRange();
    elementRange.selectNodeContents(el);
    
    // Verifica se há intersecção
    const hasIntersection = range.compareBoundaryPoints(Range.START_TO_END, elementRange) > 0 &&
                           range.compareBoundaryPoints(Range.END_TO_START, elementRange) < 0;
    
    if (!hasIntersection) {
      continue; // Sem intersecção, próximo nó
    }
    
    // Verifica se a seleção está completamente dentro do elemento
    const selectionInsideElement = 
      range.compareBoundaryPoints(Range.START_TO_START, elementRange) >= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, elementRange) <= 0;
    
    if (selectionInsideElement) {
      continue; // Caso 1: permitido
    }
    
    // Verifica se o elemento está completamente dentro da seleção
    const elementInsideSelection = 
      range.compareBoundaryPoints(Range.START_TO_START, elementRange) <= 0 &&
      range.compareBoundaryPoints(Range.END_TO_END, elementRange) >= 0;
    
    if (elementInsideSelection) {
      continue; // Caso 2: permitido
    }
    
    // Se chegou aqui, é intersecção parcial (conflito)
    return true;
  }
  
  return false;
}

const applyFormattingToSelection = (selection: Selection, tag: FormatTag): void => {
  
  if(selection.rangeCount === 0) return;
  const rangeSelected = selection.getRangeAt(0);
  const selectedText = rangeSelected.extractContents();

  const element = document.createElement(tag);
  element.appendChild(selectedText);

  rangeSelected.insertNode(element);
  
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(element);
  newRange.collapse(false);
  selection.addRange(newRange);
}

export const toggleFormattingOnSelection = (selection: Selection, tag: FormatTag): void => {
  // Tentar remover formatação existente
  if (removeTagInsideSelection(selection, tag)) return;
  if (removeTagOutsideSelection(selection, tag)) return;

  // Verificar conflitos com tags diferentes
  if (hasConflictingTags(selection, tag)) {
    alert('Não é possível aplicar formatação sobreposta.');
    return;
  }

  // Aplicar nova formatação
  applyFormattingToSelection(selection, tag);
};


export const clearFormattingOnSelection = (selection: Selection): void => {
  for(const tag of ['strong', 'i', 'u'] as FormatTag[]) {
    removeTagInsideSelection(selection, tag, true);
  }
  selection.removeAllRanges();
}