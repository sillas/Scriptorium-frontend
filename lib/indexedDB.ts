/**
 * IndexedDB utilities for local storage and sync queue management
 */

const DB_NAME = 'EditorDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {

  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for documents
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }

      // Store for chapters
      if (!db.objectStoreNames.contains('chapters')) {
        const chaptersStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chaptersStore.createIndex('documentId', 'documentId', { unique: false });
      }

      // Store for paragraphs
      if (!db.objectStoreNames.contains('paragraphs')) {
        const paragraphsStore = db.createObjectStore('paragraphs', { keyPath: 'id' });
        paragraphsStore.createIndex('chapterId', 'chapterId', { unique: false });
        paragraphsStore.createIndex('documentId', 'documentId', { unique: false });
      }
    };
  });
}

/**
 * Generic function to save data to IndexedDB
 */
export async function saveToIndexedDB<T>(
  storeName: string,
  data: T
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get data from IndexedDB
 */
export async function getFromIndexedDB<T>(
  storeName: string,
  id: string
): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get all data from IndexedDB
 */
export async function getAllFromIndexedDB<T>(
  storeName: string
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete data from IndexedDB
 */
export async function deleteFromIndexedDB(
  storeName: string,
  id: string
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get items by index from IndexedDB
 */
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: string
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get unsynced items for a document
 * Returns document, chapters and paragraphs with sync === false
 */
export async function getUnsyncedItemsForDocument(documentId: string): Promise<{
  document: any | null;
  chapters: any[];
  paragraphs: any[];
}> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'chapters', 'paragraphs'], 'readonly');
    let document: any | null = null;
    let chapters: any[] = [];
    let paragraphs: any[] = [];
    let completedOperations = 0;
    
    const checkComplete = () => {
      completedOperations++;
      if (completedOperations === 3) {
        resolve({ document, chapters, paragraphs });
      }
    };
    
    // Get document if it exists and is not synced
    const documentStore = transaction.objectStore('documents');
    const documentRequest = documentStore.get(documentId);
    
    documentRequest.onsuccess = () => {
      const doc = documentRequest.result;      
      if (doc && doc.sync === false) {
        document = doc;
      }
      checkComplete();
    };
    
    documentRequest.onerror = () => reject(documentRequest.error);
    
    // Get chapters for this document that are not synced
    const chaptersStore = transaction.objectStore('chapters');
    const chaptersIndex = chaptersStore.index('documentId');
    const chaptersRequest = chaptersIndex.getAll(documentId);
    
    chaptersRequest.onsuccess = () => {
      chapters = chaptersRequest.result.filter((ch: any) => ch.sync === false);
      checkComplete();
    };
    
    chaptersRequest.onerror = () => reject(chaptersRequest.error);
    
    // Get paragraphs for this document that are not synced
    const paragraphsStore = transaction.objectStore('paragraphs');
    const paragraphsIndex = paragraphsStore.index('documentId');
    const paragraphsRequest = paragraphsIndex.getAll(documentId);
    
    paragraphsRequest.onsuccess = () => {
      paragraphs = paragraphsRequest.result.filter((p: any) => p.sync === false);
      checkComplete();
    };
    
    paragraphsRequest.onerror = () => reject(paragraphsRequest.error);
  });
}

/**
 * Clear all data (useful for testing)
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  const storeNames = ['documents', 'chapters', 'paragraphs'];

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
