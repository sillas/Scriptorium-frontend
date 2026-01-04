import { ReactNode, useCallback, useRef } from 'react';
import { ChapterInterface } from '@/components/editor/types';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ChapterProps {
  chapter: ChapterInterface;
  setLocalChapters?: React.Dispatch<React.SetStateAction<ChapterInterface[]>>;
  onFocus?: () => void;
  onRemoteSync?: () => void;
  oneDelete?: () => void;
  children?: ReactNode;
}

const updateChapterInList = (currentChapter: ChapterInterface, updatedChapterId: string, data: TitleUpdateData) => {
  if (currentChapter.id !== updatedChapterId) return currentChapter
  return {
    ...currentChapter,
    title: data.title,
    subtitle: data.subtitle,
    updatedAt: new Date(),
    sync: false,
  };
}

export default function Chapter({ chapter, setLocalChapters, onFocus, onRemoteSync, oneDelete, children }: ChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const { SaveItemOnIndexedDB } = useLocalStorage();

  const handleChapterLocalChange = useCallback((data: TitleUpdateData) => {
    SaveItemOnIndexedDB(chapter, data, 'chapters');
  }, [chapter, SaveItemOnIndexedDB]);

  const syncChapter = useCallback((data: TitleUpdateData)  => {   
    // To update side bar chapter index. 
    setLocalChapters?.( prevChapters => 
      prevChapters.map( ch => updateChapterInList(ch, chapter.id, data))
    );
    onRemoteSync?.();
  }, [onRemoteSync, setLocalChapters]);

  const checkCanDelete = useCallback(() => {
    if(!chapterRef.current) return;
    const paragraphElements = chapterRef.current.querySelectorAll('.is-paragraph');
    if(paragraphElements.length === 0) {
      oneDelete?.();
      return;
    }
    alert('Chapter cannot be deleted while it contains paragraphs.');
  }, []);
  
  return (
    <div
      ref={chapterRef}
      onFocus={onFocus} 
      className="bg-gray-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
      
      <div className='flex flex-row w-full'>
        <button
          onClick={checkCanDelete}
          className='text-sm text-gray-400 mb-3 p-2 rounded cursor-pointer hover:bg-red-200 hover:text-slate-800 mr-0 border-r-2 border-gray-300 hover:border-slate-800'>
          x
        </button>

        <Title
          title={chapter.title}
          subtitle={chapter.subtitle}
          isSynced={chapter.sync}
          isDocumentLevel={false}
          version={chapter.version}
          createdAt={chapter.createdAt}
          updatedAt={chapter.updatedAt}
          onChange={handleChapterLocalChange}
          onRemoteSync={syncChapter}
          fontClass="font-merriweather"
        />
      </div>
      {children}
    </div>
  );
}
