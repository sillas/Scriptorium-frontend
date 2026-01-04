import { Db } from 'mongodb';

/**
 * Gera um slug a partir de um título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Verifica se um slug já existe na coleção e retorna um slug único
 * Se o slug já existir, adiciona um índice numérico no início
 */
export async function ensureUniqueSlug(
  db: Db,
  collection: string,
  title: string,
  slug: string
): Promise<{ title: string; slug: string }> {
  let index = 0;
  const originalTitle = title;
  const originalSlug = slug;
  let currentTitle = title;
  let currentSlug = slug;
  let isUnique = false;

  while (!isUnique) {
    const existing = await db.collection(collection).findOne({ slug: currentSlug });
    
    if (existing) {
      index++;
      currentTitle = `[${index}] ${originalTitle}`;
      currentSlug = `${index}-${originalSlug}`;
    } else {
      isUnique = true;
    }
  }

  return { title: currentTitle, slug: currentSlug };
}
