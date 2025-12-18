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
    textDocument: DocumentInterface,
    unsyncedChapters: ChapterInterface[]
) => {
    const updatedChapters = [...textDocument.chapters!];

    unsyncedChapters.forEach((unsyncedChapter: ChapterInterface) => {
        proccessChapter(unsyncedChapter, updatedChapters)
    })
    
    textDocument.chapters = updatedChapters;
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
        // const chapterParagraphs = updatedParagraphs.filter(p => p.chapterId === unsyncedParagraph.chapterId);
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
    chapter: ChapterInterface,
    unsyncedParagraph: ParagraphInterface[]) => {
    
    const updatedParagraphs = [...chapter.paragraphs ?? []];

    if( unsyncedParagraph.length > 0 ) {
        unsyncedParagraph.forEach((unsyncedParagraph: ParagraphInterface) => {
            processParagraph(unsyncedParagraph, updatedParagraphs)
        });
    }

    // Sort paragraphs by index to ensure correct order
    updatedParagraphs.sort((a, b) => a.index - b.index);

    chapter.paragraphs = updatedParagraphs;
}

export const loadUnsyncedData = async (
    textDocument: DocumentInterface,
    setLocalDocument: (document: DocumentInterface) => void
) => {
    try {
        const unsyncedData = await getUnsyncedItemsForDocument(textDocument.id.toString());

        const unsyncedDocument = unsyncedData.document
        const unsyncedChapters = unsyncedData.chapters
        const unsyncedParagraphs = unsyncedData.paragraphs

        console.log('=== Unsynced data found in IndexedDB ===');
        
        // Create a working copy of the document
        let updatedDocument = { ...textDocument };
    
        if (unsyncedChapters.length > 0) {
            proccessChapters(updatedDocument, unsyncedChapters)
        }
                
        updatedDocument.chapters!.forEach(chapter => {
            processParagraphs(
                chapter,
                unsyncedParagraphs.filter(p => p.chapterId === chapter.id)
            )
        })
        
        if (unsyncedDocument) {
            // Merge document properties with unsynced version from IndexedDB
            updatedDocument = {
                ...updatedDocument, 
                ...unsyncedDocument
            };
        }
        
        setLocalDocument(updatedDocument);
        console.log('=== end of unsynced data processing ===');
        
    } catch (error) {
        console.error('Error loading unsynced data from IndexedDB:', error);
    }
};