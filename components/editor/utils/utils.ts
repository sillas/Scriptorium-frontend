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
 * Handles right-click event on a div element, preventing the default context menu.
 * @param event The mouse event triggered by right-click
 * @returns 
 */
export const handleRightClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // event.preventDefault();
    if( event.button !== 2 ) return;
    console.log(event);
    // TODO: Handle right-click context menu
}