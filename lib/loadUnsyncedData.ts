import { getUnsyncedItemsForDocument } from '@/lib/indexedDB';
import {
    DocumentInterface,
    ParagraphInterface,
    ChapterInterface
} from '@/components/editor/utils/interfaces';

const proccessChapter = (unsyncedChapter: ChapterInterface, updatedChapters: ChapterInterface[]) => {

    // Skip deleted chapters
    if ((unsyncedChapter as any).deleted) {
        const chapterIndex = updatedChapters.findIndex(ch => ch.id === unsyncedChapter.id);
        if (chapterIndex !== -1) {
            updatedChapters.splice(chapterIndex, 1);
        }
        return;
    }

    if (unsyncedChapter.id.startsWith('temp-')) {
        // New chapter - add it in the correct position by index
        const insertIndex = updatedChapters.findIndex(ch => ch.index > unsyncedChapter.index);

        if (insertIndex === -1) {
            updatedChapters.push(unsyncedChapter);
            return
        }
        
        updatedChapters.splice(insertIndex, 0, unsyncedChapter);
        return
    }

    // Existing chapter - replace with unsynced version
    const chapterIndex = updatedChapters.findIndex(ch => ch.id === unsyncedChapter.id);

    if (chapterIndex !== -1) {
        updatedChapters[chapterIndex] = unsyncedChapter;
    }
}

const proccessChapters = (
    chapters: ChapterInterface[],
    unsyncedChapters: ChapterInterface[]
) => {
    const updatedChapters = [...chapters];

    unsyncedChapters.forEach((unsyncedChapter: ChapterInterface) => {
        proccessChapter(unsyncedChapter, updatedChapters)
    })
    
    return updatedChapters;
}

const processParagraph = (unsyncedParagraph: ParagraphInterface, updatedParagraphs: ParagraphInterface[]) => {
    
    // Skip deleted paragraphs
    if ((unsyncedParagraph as any).deleted) {
        const paragraphIndex = updatedParagraphs.findIndex(p => p.id === unsyncedParagraph.id);
        if (paragraphIndex !== -1) {
            updatedParagraphs.splice(paragraphIndex, 1);
        }
        return;
    }

    if (unsyncedParagraph.id.startsWith('temp-')) {
        // New paragraph - add it in the correct position by index within its chapter
        const insertIndex = updatedParagraphs.findIndex(p =>
            p.chapterId === unsyncedParagraph.chapterId && p.index > unsyncedParagraph.index
        );

        if (insertIndex === -1) {
            // Add at the end
            const lastChapterParIndex = updatedParagraphs.map((p, idx) =>
                p.chapterId === unsyncedParagraph.chapterId ? idx : -1
            ).filter(idx => idx !== -1).pop();

            if (lastChapterParIndex !== undefined) {
                updatedParagraphs.splice(lastChapterParIndex + 1, 0, unsyncedParagraph);
                return
            }

            updatedParagraphs.push(unsyncedParagraph);
            return
        }

        updatedParagraphs.splice(insertIndex, 0, unsyncedParagraph);
        return
    }

    // Existing paragraph - replace with unsynced version
    const paragraphIndex = updatedParagraphs.findIndex(p => p.id === unsyncedParagraph.id);
    if (paragraphIndex !== -1) {
        updatedParagraphs[paragraphIndex] = unsyncedParagraph;
    }
}

const processParagraphs = (
    paragraphs: ParagraphInterface[],
    unsyncedParagraphs: ParagraphInterface[]
) => {
    const updatedParagraphs = [...paragraphs];

    if( unsyncedParagraphs.length > 0 ) {
        unsyncedParagraphs.forEach((unsyncedParagraph: ParagraphInterface) => {
            processParagraph(unsyncedParagraph, updatedParagraphs)
        });
    }

    // Sort paragraphs by index to ensure correct order
    updatedParagraphs.sort((a, b) => a.index - b.index);
    return updatedParagraphs;
}

export const loadUnsyncedData = async (
    document: DocumentInterface,
    chapters: ChapterInterface[],
    paragraphs: ParagraphInterface[],
    setDocument: (document: DocumentInterface) => void,
    setChapters: (chapters: ChapterInterface[]) => void,
    setParagraphs: (paragraphs: ParagraphInterface[]) => void
) => {
    try {
        const unsyncedData = await getUnsyncedItemsForDocument(document.id.toString());

        const unsyncedDocument = unsyncedData.document
        const unsyncedChapters = unsyncedData.chapters
        const unsyncedParagraphs = unsyncedData.paragraphs

        console.log('=== Unsynced data found in IndexedDB ===');
        
        if (unsyncedChapters.length > 0) {
            const updatedChapters = proccessChapters(chapters, unsyncedChapters);
            setChapters(updatedChapters);
        }
                
        if (unsyncedParagraphs.length > 0) {
            const updatedParagraphs = processParagraphs(paragraphs, unsyncedParagraphs);
            setParagraphs(updatedParagraphs);
        }
        
        if (unsyncedDocument) {
            // Merge document properties with unsynced version from IndexedDB
            const updatedDocument = {
                ...document, 
                ...unsyncedDocument
            };
            setDocument(updatedDocument);
        }
        
        console.log('=== end of unsynced data processing ===');
        
    } catch (error) {
        console.error('Error loading unsynced data from IndexedDB:', error);
    }
};