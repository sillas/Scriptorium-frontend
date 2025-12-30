/**
 * Sets the cursor position at the clicked coordinates within a contentEditable element.
 * Should be called after the element becomes contentEditable.
 * 
 * @param x - The clientX coordinate of the click event
 * @param y - The clientY coordinate of the click event
 */
export function setCursorPositionAtClick(x: number, y: number): void {
    const range = document.createRange();
    const selection = window.getSelection();
    
    if (!selection) return;

    // Usar caretPositionFromPoint ou caretRangeFromPoint (compatibilidade entre navegadores)
    if (!document.caretPositionFromPoint) return;
  
    const position = document.caretPositionFromPoint(x, y);
  
    if (position) {
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
    }

    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Handles click on a contentEditable element, focusing it and positioning the cursor
 * at the click coordinates.
 * 
 * @param event - The mouse click event
 * @param elementRef - Reference to the element to make editable
 */
export function handleContentEditableClick(
    event: React.MouseEvent,
    elementRef: React.RefObject<HTMLElement | null>
): void {
    elementRef.current?.focus();
    setTimeout(() => setCursorPositionAtClick(event.clientX, event.clientY), 20);
}

/**
 * 1Handles click on an editable item, setting it to editing mode and focusing it.
 * @param event The mouse click event
 * @param itemRef Reference to the editable item
 * @param isEditing Whether the item is currently in editing mode
 * @param setEditing Function to update the editing state
 * @returns 
 */
export function handleClick(
    event: React.MouseEvent<HTMLHeadingElement>, 
    itemRef: React.RefObject<HTMLHeadingElement | null>, 
    isEditing?: boolean,
    setEditing?: React.Dispatch<React.SetStateAction<boolean>>
): void {
    if (isEditing) return;
    setEditing?.(true);
    handleContentEditableClick(event, itemRef);
}

/**
 * Updates cursor position state based on current selection within a contentEditable element.
 * @param elementRef Reference to the editable element
 * @param isEditing Whether the element is currently in editing mode
 * @param setIsCursorAtFirstPosition Function to update state indicating if cursor is at the first position
 * @param setIsCursorAtLastPosition Function to update state indicating if cursor is at the last position
 * @returns 
 */
export const updateCursorPosition = (
    elementRef: React.RefObject<HTMLElement | null>,
    isEditing: boolean,
    setIsCursorAtFirstPosition: React.Dispatch<React.SetStateAction<boolean>>,
    setIsCursorAtLastPosition: React.Dispatch<React.SetStateAction<boolean>>
) => {
    if (!isEditing || !elementRef.current) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(elementRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const cursorPosition = preSelectionRange.toString().length;
    const totalLength = elementRef.current.textContent.length;

    setIsCursorAtFirstPosition(cursorPosition === 0);
    setIsCursorAtLastPosition(cursorPosition === totalLength);
  };

/**
 * Sets the cursor at the start or end of a contentEditable element.
 * @param elementRef Reference to the editable element
 * @param position 'START' to set cursor at start, 'END' to set at end
 */
export const setCursorAt = (
    elementRef: React.RefObject<HTMLElement | null>, 
    position: 'START' | 'END'
) => {
    setTimeout(() => {
        if (!elementRef.current) return;
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        range.collapse(position === 'START');
        
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }, 20);
}

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

/**
 * Gets the selected text and its start and end positions within a contentEditable div.
 * @param event The mouse click event on the div
 * @returns Information about the selected text and its positions, or null if no selection 
 */
export function getSelection(event: React.MouseEvent<HTMLDivElement>): Selection | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return null; // No selection

    return selection
}

type FormatTag = 'strong' | 'i' | 'u';

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

export const clearFormattingOnSelection = (selection: Selection): void => {
  for(const tag of ['strong', 'i', 'u'] as FormatTag[]) {
    removeTagInsideSelection(selection, tag, true);
  }
  selection.removeAllRanges();
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