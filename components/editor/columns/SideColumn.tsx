import { useState } from 'react';

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
  const buttonOffset = isOpen ? 'calc(25% - 2rem)' : '0';

  return (<button
      aria-label={`${isOpen ? 'Fechar' : 'Abrir'} painel ${side === 'left' ? 'esquerdo' : 'direito'}`}
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className={`absolute ${buttonPosition} top-0 z-20 w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all translate-x-0 ${
      isOpen ? 'text-white opacity-100' : 'text-black opacity-50'
      }`}
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
      className={`bg-slate-600 transition-all duration-300 ease-in-out relative ${
      isOpen ? 'w-1/4' : 'w-0'
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
  const [isOpen, setOpen] = useState(true);
  
  return (
    <>
      <ArrowButton side={side} isOpen={isOpen} setOpen={setOpen} />
      <Aside isOpen={isOpen}>
        {children}
      </Aside>
    </>
  );
}