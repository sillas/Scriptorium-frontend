'use client';

import { useMemo, useRef,JSX } from 'react';
import {
  DocumentInterface,
  ChapterInterface,
  ParagraphInterface,
} from '@/components/editor/types';
import EditorHeader from '@/components/editor/Header';
import { Title } from '@/components/editor/editorComponents/Title';
import Chapter from '@/components/editor/editorComponents/Chapter';
import { DoublyLinkedList } from '@/lib/editor/doublyLinkedList';
import { ParagraphList } from '@/components/editor/editorComponents/Paragraph';
import RightAside from '@/components/editor/editorComponents/RightAside';
import LeftAside from '@/components/editor/editorComponents/LeftAside';
import Contents from '@/components/editor/editorComponents/Contents';
import AddButton from '@/components/editor/editorComponents/AddButton';

interface ClientEditorProps {
  initialDocument: DocumentInterface;
  chapters: ChapterInterface[];
  paragraphs: ParagraphInterface[];
}

export function ClientEditorT({ initialDocument, chapters, paragraphs }: ClientEditorProps) {

    const isNavigatingRef = useRef(false);
    const paragraphsRef = useRef(new DoublyLinkedList<ParagraphInterface>());
    paragraphsRef.current.create(paragraphs);

    const componentsDataView: (ChapterInterface & { Paragraphs: JSX.Element })[] = useMemo(() => {
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
            const ps = paragraphsByChapter.get(chapter.id) || []
            return {
                ...chapter,
                Paragraphs: <ParagraphList 
                    key={`plist_${chapter.id}`}
                    paragraphs={ps}
                    isNavigatingRef={isNavigatingRef}
                />
            }
        });
    }, [chapters, paragraphsRef.current]);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
              <EditorHeader slug={initialDocument.title} isOnline={true} syncInProgress={false} />
              <div className="flex flex-1 overflow-hidden relative">

                <LeftAside>
                    <div className="text-sm text-gray-800">
                    <Contents
                        chapters={chapters}
                        syncInProgress={false}
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
                            {chapter.Paragraphs}
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