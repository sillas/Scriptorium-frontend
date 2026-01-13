/**
 * Conta o número de palavras em um texto.
 * @param text 
 * @returns 
 */
export const countWords = (text: string) => {
  if (!text) return 0;
  return text === '' ? 0 : text.trim().split(/\s+/).length;
}

/**
 * Remove tags HTML de uma string.
 * - Remove tags válidas como <b>, </b>, <br />, <a href="...">
 * - Mantém texto como <palavra chave> que não é uma tag HTML válida
 * @param text 
 * @returns 
 */
const stripHtmlTags = (text: string): string => {
  if (!text) return '';
  
  return text.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(\s+[^>]*)?\/?>/g, (match) => {
    // Verifica se parece uma tag HTML válida
    // Tags válidas não têm espaços no nome, ou têm espaços seguidos de atributos (contêm =) ou />
    const hasSpace = match.includes(' ');
    
    if (!hasSpace) {
      // Tags simples como <b>, </b>, <br/>
      return '';
    }
    
    // Se tem espaço, verifica se é seguido por = (atributo) ou /
    const afterTagName = match.substring(match.indexOf(' '));
    if (afterTagName.includes('=') || afterTagName.trim().startsWith('/')) {
      // Tag válida com atributo ou auto-fechada
      return '';
    }
    
    // Não parece tag HTML válida, mantém o texto original
    return match;
  });
}

export const countCharacters = (text: string) => {
  text = text.trim()
  if (!text) return 0;
  if (text.includes('<')) text = stripHtmlTags(text);
  return text.length;
}