'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  DocumentInterface,
  ChapterInterface,
  ParagraphInterface,
  NavigationDirection,
} from '@/components/editor/types';
import EditorHeader from '@/components/editor/Header';
import { Title } from '@/components/editor/editorComponents/Title';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { DoublyLinkedList, ListNode } from '@/lib/editor/doublyLinkedList';
import { ParagraphList } from '@/components/editor/editorComponents/Paragraph';
import RightAside from '@/components/editor/editorComponents/RightAside';
import LeftAside from '@/components/editor/editorComponents/LeftAside';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getFromIndexedDB } from '@/lib/indexedDB';

interface ClientEditorProps {
  initialDocument: DocumentInterface;
  chapters: ChapterInterface[];
  paragraphs: ParagraphInterface[];
}

export function ClientEditorT({ initialDocument, chapters, paragraphs }: ClientEditorProps) {

    const paragraphsRef = useRef(new DoublyLinkedList<ParagraphInterface>());
    const isNavigatingRef = useRef(false);
    const isInitializedRef = useRef(false);
    const initialParagraphsRef = useRef<Map<string, ParagraphInterface>>(new Map());

    const [refresh, setRefresh] =  useState(false);
    const [syncInProgress, setSyncInProgress] = useState(true);

    const [ setDebounce, clearDebounceTimer ] = useDebounceTimer();
    const { SaveItemOnIndexedDB, waitForPendingSaves } = useLocalStorage();
    
    // Inicializar a DoublyLinkedList apenas uma vez, de forma síncrona
    if (!isInitializedRef.current) {
        paragraphsRef.current.create(paragraphs.map(p => {
            initialParagraphsRef.current.set(p.id, { ...p });
            return { ...p };
        }));
        isInitializedRef.current = true;
    }
    
    // -----------------------------
    const syncAllWithoutDebounce = useCallback(() => {
        setSyncInProgress(true);

        console.log('SYNC ======================');
        for (const paragraph of paragraphsRef.current.values()) {
            if (paragraph.sync === false) {
                // TODO
                console.log('SYNC: ', paragraph.index, paragraph.text.slice(0, 30));
                paragraph.sync = true;
            }
        }
        console.log('SYNC ====================##');

        setSyncInProgress(false);
    }, []);

    const syncAll = useCallback(() => {
        console.log('syncAll syncAll');
        
        clearDebounceTimer();
        setDebounce(() => {
            const activeElement = document.activeElement;
            if (activeElement?.getAttribute('contenteditable') === 'true') {
                return;
            }
            syncAllWithoutDebounce();
        }, 5000); // prevent auto-sync for 5s after manual sync

    }, [setDebounce, clearDebounceTimer, syncAllWithoutDebounce]);

    // -----------------------------
    const reorderParagraph = useCallback((paragraphId: string, direction: NavigationDirection) => {
        
        const node = paragraphsRef.current.get(paragraphId, true) as ListNode<ParagraphInterface> | null;
        if (!node) return;
        node.data.sync = false;
        let node2 = null;

        if (direction === 'Up' && node.prev) {
            node2 = node.prev;
        } else if (direction === 'Down' && node.next) {
            node2 = node.next;
        } else {
            return;
        }

        const updatedData: ParagraphInterface[] = []

        if (node2.data.chapterId !== node.data.chapterId) {
            node.data.chapterId = node2.data.chapterId;
            updatedData.push(node.data);
        } else {
            node2.data.sync = false;
            [node.data.index, node2.data.index] = [node2.data.index, node.data.index];
            paragraphsRef.current.swap(paragraphId, node2.id);

            updatedData.push(node.data);
            updatedData.push(node2.data);
        }

        waitForPendingSaves().finally(() => {
            (async () => {
                for (const p of updatedData) {
                    const existing = await getFromIndexedDB<ParagraphInterface>('paragraphs', p.id);
                    if (existing) {
                        p.text = existing.text;
                        p.textAlignment = existing.textAlignment;
                        p.isQuote = existing.isQuote;
                        p.isHighlighted = existing.isHighlighted;
                    }
                    SaveItemOnIndexedDB(p, null, 'paragraphs');
                }

                syncAll();
                setRefresh((prev) => !prev); // Trigger re-render
            })();
        });

    }, [syncAll, SaveItemOnIndexedDB, waitForPendingSaves]);


    useEffect(() => {
        setSyncInProgress(false);
    }, [refresh]);
    // -----------------------------

    const componentsDataView: (ChapterInterface & { paragraphs: ParagraphInterface[] })[] = useMemo(() => {
        // Agrupar parágrafos por chapterId em uma única passagem - O(M) ao invés de O(N × M)
        const paragraphsByChapter = new Map<string, ParagraphInterface[]>();
        
        for (const paragraph of paragraphsRef.current.values()) {
            const chapterId = paragraph.chapterId;
            if (!paragraphsByChapter.has(chapterId)) {
                paragraphsByChapter.set(chapterId, []);
            }
            paragraphsByChapter.get(chapterId)!.push(paragraph);
        }
        
        
        return chapters.map((chapter) => {
            const ps = paragraphsByChapter.get(chapter.id) || [];
            return {
                ...chapter,
                paragraphs: ps
            }
        });
    }, [chapters, refresh]);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
              <EditorHeader slug={initialDocument.title} isOnline={true} syncInProgress={syncInProgress} />
              <div className="flex flex-1 overflow-hidden relative">

                <LeftAside>
                    <div className="text-sm text-gray-800">
                    <Contents
                        chapters={chapters}
                        syncInProgress={syncInProgress}
                        />
                    </div>
                </LeftAside>

                <main
                    className={`bg-gray-100 flex-1 transition-all duration-300 ease-in-out p-4 overflow-y-auto custom-scrollbar`}
                >
                    <Title
                        isDocumentLevel={true}
                        title={initialDocument.title}
                        subtitle={initialDocument.subtitle}
                        version={initialDocument.version}
                        updatedAt={initialDocument.updatedAt}
                        createdAt={initialDocument.createdAt}
                        isSynced={initialDocument.sync}
                        fontClass={initialDocument.fontClass || "font-merriweather"}
                    />
                                                                                                                                                                                    
                    {componentsDataView.map((chapter) => (
                        <Chapter
                            key={chapter.id}
                            chapter={chapter}
                        >
                            <ParagraphList 
                                key={`plist_${chapter.id}`}
                                paragraphs={chapter.paragraphs}
                                isNavigatingRef={isNavigatingRef}
                                onRemoteSync={syncAll}
                                onReorder={reorderParagraph}
                            />
                            <AddButton key={`add_${chapter.id}`} type="paragraphs" onClick={() => {}} />
                        </Chapter>
                    ))}
                    <AddButton type="chapters" onClick={() => {}} />
                </main>

                <RightAside>
                    <div className="text-sm text-gray-800 p-4">Right</div>
                </RightAside>
              </div>
        </div>
    )
}