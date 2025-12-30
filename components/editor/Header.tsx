import { useIsOnline } from '@/components/OnlineStatusProvider';
import { useState, useEffect } from 'react';
interface EditorHeaderProps {
  slug: string;
}

export default function EditorHeader({ slug }: EditorHeaderProps) {
  const isOnline = useIsOnline();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (<header className="w-full h-14 bg-gray-800 flex items-center px-4 z-10">
      <div className="text-white text-sm">{slug}{mounted && isOnline === false ? ' - Offline' : ''}</div>
    </header>);
}