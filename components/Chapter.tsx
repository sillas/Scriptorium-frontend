import { ReactNode } from 'react';

interface ChapterProps {
  children?: ReactNode;
}

export default function Chapter({ children }: ChapterProps) {
  return (
    <div className="bg-slate-100 rounded-lg p-4 mb-4 shadow-sm">
      {children}
    </div>
  );
}
