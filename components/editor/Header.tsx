import { useIsOnline } from '@/components/OnlineStatusProvider';
interface EditorHeaderProps {
  slug: string;
}

export default function EditorHeader({ slug }: EditorHeaderProps) {
  const isOnline = useIsOnline();
    return (<header className="w-full h-14 bg-slate-700 flex items-center px-4 z-10">
        <div className="text-white text-sm">{slug}{isOnline ? '' : ' - Offline'}</div>
      </header>);
}``