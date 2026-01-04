import { useState, useEffect } from 'react';
interface EditorHeaderProps {
  slug: string;
  isOnline?: boolean | null;
}

export default function EditorHeader({ slug, isOnline }: EditorHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (<header className="w-full h-14 bg-gray-800 flex items-center px-4 z-10">
      <div className="text-white text-sm">{slug}{mounted && isOnline === false ? ' - Offline' : ''}</div>
    </header>);
}