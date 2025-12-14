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
 * @param e - The mouse click event
 * @param elementRef - Reference to the element to make editable
 */
export function handleContentEditableClick(
    e: React.MouseEvent,
    elementRef: React.RefObject<HTMLElement | null>
): void {
    elementRef.current?.focus();
    setTimeout(() => setCursorPositionAtClick(e.clientX, e.clientY), 20);
}
