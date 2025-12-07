import { ReactNode } from 'react';

interface ChapterProps {
  id: string;
  children?: ReactNode;
}

export default function Chapter({ id, children }: ChapterProps) {
  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm" id={`chapter-${id}`}>
      {children}
    </div>
  );
}
