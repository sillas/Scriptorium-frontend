import { ReactNode, useCallback } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';

interface ChapterProps {
  chapter: ChapterInterface;
  children?: ReactNode;
  onChange: (chapter: ChapterInterface, data: TitleUpdateData) => Promise<boolean> | boolean;
  setUpdate: React.Dispatch<React.SetStateAction<{id: string, index: number, title: string}[]>>;
  onSubtitleTab?: () => boolean;
}

export default function Chapter({ chapter, children, onChange, setUpdate, onSubtitleTab }: ChapterProps) {
  
  const updateMenuList = useCallback((title: string) => {
    
    setUpdate( prev => {
      const existingIndex = prev.findIndex( item => item.id === chapter.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], title };
        return updated;
      } else {
        return [...prev, { id: chapter.id, index: prev.length, title }];
      }
    });
  
  }, [chapter, setUpdate]);

  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
      <Title
        title={chapter.title === '' ? 'Insert a Title' : chapter.title}
        subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
        onRemoteSync={() => {}}
        onChange={ data => { updateMenuList(data.title); return onChange(chapter, data);} }
        onSubtitleTab={onSubtitleTab}
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
