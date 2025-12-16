import { ReactNode } from 'react';
import { ChapterInterface } from '@/components/editor/utils/interfaces';
import { Title, UpdatedTitleInterface } from '@/components/editor/editorComponents/Title';

interface ChapterProps {
  chapter: ChapterInterface;
  children?: ReactNode;
  onChange: (chapter: ChapterInterface, data: UpdatedTitleInterface) => void;
}

export default function Chapter({ chapter, children, onChange }: ChapterProps) {
  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${chapter.id}`}>
      <Title
        title={chapter.title === '' ? 'Insert a Title' : chapter.title}
        subtitle={chapter.subtitle === '' ? 'Add a subtitle' : chapter.subtitle}
        onRemoteSync={() => {}}
        onChange={ data => onChange(chapter, data) }
        isSynced={chapter.sync}
        // isOnline={isOnline}
        isDocumentTitle={false}
        version={chapter.version}
        createdAt={chapter.createdAt}
        updatedAt={chapter.updatedAt}
      />
      {children}
    </div>
  );
}
