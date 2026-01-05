import { useState, useEffect } from 'react';
import { CloudCheck, LoaderCircle } from 'lucide-react';
interface EditorHeaderProps {
  slug: string;
  syncInProgress?: boolean;
  isOnline?: boolean | null;
}

export default function EditorHeader({ slug, isOnline, syncInProgress }: EditorHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (<header className="w-full h-14 bg-gray-800 flex items-center px-4 z-10">
      <div className="text-white text-sm">
        {slug}{mounted && isOnline === false ? ' - Offline' : ''}
      </div>
      <div className="ml-auto">
        {syncInProgress ? <LoaderCircle color='white' className="animate-spin" /> : <CloudCheck color='white' />}
      </div>
    </header>);
}