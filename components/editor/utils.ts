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

