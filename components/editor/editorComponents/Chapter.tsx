import { ReactNode, useCallback } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ChapterProps {
  chapter: ChapterInterface;
  children?: ReactNode;
}

export default function Chapter({ chapter, children }: ChapterProps) {

  const { chapterLocalSave } = useLocalStorage();

  const handleChapterLocalChange = useCallback( async (data: TitleUpdateData) => {
    await chapterLocalSave(chapter, data);
  }, [chapter, chapterLocalSave]);
  
  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
      <Title
        title={chapter.title === '' ? 'Insert a Title' : chapter.title}
        subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
        onRemoteSync={(title) => console.log('Syncing...', title)}
        onChange={handleChapterLocalChange}
        onSubtitleTab={() => false}
        isSynced={chapter.sync}
        isDocumentLevel={false}
        version={chapter.version}
        createdAt={chapter.createdAt}
        updatedAt={chapter.updatedAt}
      />
      {children}
    </div>
  );
}
