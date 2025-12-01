import { ReactNode } from 'react';

interface ParagraphProps {
  children?: ReactNode;
}

export default function Paragraph({ children }: ParagraphProps) {
  return (
    <div className="bg-slate-50 rounded-md p-3 mb-2 shadow-sm text-slate-800">
      {children}
    </div>
  );
}
