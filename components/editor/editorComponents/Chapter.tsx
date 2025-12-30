import { ReactNode, useCallback } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
  
  return (
    <div
      onFocus={onFocus} 
      className="bg-gray-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
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
