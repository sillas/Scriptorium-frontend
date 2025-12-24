import { ReactNode, useCallback } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, TitleUpdateData } from '@/components/editor/editorComponents/Title';

interface ChapterProps {
  chapter: ChapterInterface;
  children?: ReactNode;
}

export default function Chapter({ chapter, children }: ChapterProps) {
  
  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
      <Title
        title={chapter.title === '' ? 'Insert a Title' : chapter.title}
        subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
        onRemoteSync={() => {}}
        onChange={ data => false }
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
