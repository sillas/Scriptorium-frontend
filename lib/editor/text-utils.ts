/**
 * Conta o número de palavras em um texto.
 * @param text 
 * @returns 
 */
export const countWords = (text: string) => {
  if (!text) return 0;
  return text === '' ? 0 : text.trim().split(/\s+/).length;
}

export const countCharacters = (text: string) => {
  if (!text) return 0;
  return text.trim().length;
}