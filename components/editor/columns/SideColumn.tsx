
export function SideColumn({ side, isOpen, setOpen, children }: { side: "left" | "right", isOpen: boolean, setOpen: (open: boolean) => void, children: React.ReactNode }) {
  return (
    <>
      <button
          onClick={() => setOpen(!isOpen)}
          className={`absolute ${side}-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
          isOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
          }`}
          style={{ [side]: isOpen ? 'calc(25% - 2rem)' : '0' }}
      >
          { side === 'left' ? (isOpen ? '◀' : '▶') : (isOpen ? '▶' : '◀')}
      </button>
      
      <aside
          className={`bg-slate-600 transition-all duration-300 ease-in-out relative ${
          isOpen ? 'w-1/4' : 'w-0'
          }`}
      >
          <div className={`h-full ${isOpen ? 'pl-6 pt-4' : 'p-0'}`}>
          {isOpen && children}
          </div>
      </aside>
    </>
  );
}