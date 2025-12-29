import { useState, useEffect } from 'react';

interface ArrowButtonProps {
  side: "left" | "right";
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ArrowButton({ side, isOpen, setOpen }: ArrowButtonProps) {

  const getArrowIcon = () => {
    if (side === 'left') return isOpen ? '◀' : '▶';
    return isOpen ? '▶' : '◀';
  }

  const buttonPosition = side === 'left' ? 'left-0' : 'right-0';
  const buttonOffset = isOpen ? 'calc(min(25%, 200px) - 2rem)' : '0';

  return (<button
      aria-label={`${isOpen ? 'Fechar' : 'Abrir'} painel ${side === 'left' ? 'esquerdo' : 'direito'}`}
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className={`absolute cursor-pointer ${buttonPosition} top-1 z-20 w-8 h-8 flex items-center justify-center text-xs rounded-full hover:opacity-100 hover:p-3 transition-all translate-x-0 text-gray-800 hover:text-white hover:bg-gray-800 shadow-xl shadow-black/20 opacity-50`}
      style={{ [side]: buttonOffset }}
  >
      { getArrowIcon() }
  </button>);
}

interface AsideProps {
  isOpen: boolean;
  children: React.ReactNode;
}

function Aside({ isOpen, children }: AsideProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={`bg-gray-100 transition-all duration-300 ease-in-out relative ${
      isOpen ? 'w-1/4 max-w-[200px]' : 'w-0'
      }`}
    >
      <div className={`h-full ${isOpen ? 'pl-6 pt-4' : 'p-0'}`}>
      {isOpen && children}
      </div>
    </aside>
  )
}

interface SideColumnProps {
  side: "left" | "right";
  children: React.ReactNode;
}

export default function SideColumn({ side, children }: SideColumnProps) {
  const storageKey = `sideColumn-${side}-isOpen`;
  const [isOpen, setOpen] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      setOpen(stored === 'true');
    }
  }, [storageKey]);
  
  useEffect(() => {
    sessionStorage.setItem(storageKey, isOpen ? 'true' : 'false');
  }, [isOpen, storageKey]);
  
  return (
    <>
      <ArrowButton side={side} isOpen={isOpen} setOpen={setOpen} />
      <Aside isOpen={isOpen}>
        {children}
      </Aside>
    </>
  );
}