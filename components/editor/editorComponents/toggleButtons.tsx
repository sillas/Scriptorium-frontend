
export function EditorToggleButtons({ side, isOpen, setOpen }: { side: 'left' | 'right'; isOpen: boolean; setOpen: (open: boolean) => void }) {
  return (
    <button
        onClick={() => setOpen(!isOpen)}
        className={`absolute ${side}-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
        }`}
        style={{ [side]: isOpen ? 'calc(25% - 2rem)' : '0' }}
    >
        { side === 'left' ? (isOpen ? '◀' : '▶') : (isOpen ? '▶' : '◀')}
    </button>
  );
}