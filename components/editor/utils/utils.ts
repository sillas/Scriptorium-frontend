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

export function handleClick(e: React.MouseEvent<HTMLHeadingElement>, itemRef: React.RefObject<HTMLHeadingElement | null>, isEditing: boolean, setEditing: React.Dispatch<React.SetStateAction<boolean>>): void {
    if (isEditing) return;
    setEditing(true)
    handleContentEditableClick(e, itemRef);
}

/**
 * 
 * @param elementRef 
 * @param isEditing 
 * @param setIsCursorAtFirstPosition 
 * @param setIsCursorAtLastPosition 
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

export  const setCursorAt = (elementRef: React.RefObject<HTMLElement | null>, position: 'START' | 'END') => {
    setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(elementRef.current!);
    range.collapse(position === 'START');
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    }, 0);
}