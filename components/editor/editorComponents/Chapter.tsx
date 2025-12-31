import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { on } from 'events';

interface ChapterProps {
  chapter: ChapterInterface;
  setChapters?: React.Dispatch<React.SetStateAction<ChapterInterface[]>>;
  onFocus?: () => void;
  onRemoteSync?: () => void;
  children?: ReactNode;
}

const updateChapterInList = (currentChapter: ChapterInterface, updatedChapterId: string, data: TitleUpdateData) => {
  if (currentChapter.id !== updatedChapterId) return currentChapter
  return {
    ...currentChapter,
    title: data.title,
    subtitle: data.subtitle,
    updatedAt: data.updatedAt || new Date(),
  };
}

export default function Chapter({ chapter, setChapters, onFocus, onRemoteSync, children }: ChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const [canDelete, setCanDelete] = useState(false);
  const { chapterLocalSave } = useLocalStorage();

  const handleChapterLocalChange = useCallback( async (data: TitleUpdateData) => {
    await chapterLocalSave(chapter, data);
  }, [chapter, chapterLocalSave]);

  const setLocalChapters = useCallback((data: TitleUpdateData)  => {
    setChapters?.( prevChapters => 
      prevChapters.map( ch => updateChapterInList(ch, chapter.id, data))
    );
    onRemoteSync?.();
  }, [onRemoteSync, setChapters]);

  const onFocusCheckCanDelete = useCallback(() => {
    onFocus?.();
    if(!chapterRef.current) return;
    const paragraphElements = chapterRef.current.querySelectorAll('.is-paragraph');
    setCanDelete(paragraphElements.length === 0);
  }, [onFocus]);
  
  return (
    <div
      ref={chapterRef}
      onFocus={onFocusCheckCanDelete} 
      className="bg-gray-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>

      {canDelete && <div className='bg-white text-sm text-gray-500 mb-2 p-2 rounded'>
        Can Delete Chapter - No paragraphs inside
      </div>}

      <Title
        title={chapter.title}
        subtitle={chapter.subtitle}
        isSynced={chapter.sync}
        isDocumentLevel={false}
        version={chapter.version}
        createdAt={chapter.createdAt}
        updatedAt={chapter.updatedAt}
        onChange={handleChapterLocalChange}
        onRemoteSync={setLocalChapters}
        fontClass="font-merriweather"
      />
      {children}
    </div>
  );
}
