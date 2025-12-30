import { useState, useEffect } from 'react';
import { ListTree, ArrowLeftFromLine, ArrowRightFromLine, Brain } from 'lucide-react';

interface ToggleButtonProps {
  side: "left" | "right";
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ToggleButton({ side, isOpen, setOpen }: ToggleButtonProps) {
  const isLeft = side === 'left';
  const getArrowIcon = () => {
    if (isLeft) return isOpen ? <ArrowLeftFromLine color="#1e2939" /> : <ListTree color="#1e2939" />;
    return isOpen ? <ArrowRightFromLine color="#1e2939" /> : <Brain color="#1e2939" />;
  }

  const buttonPosition = isLeft ? 'left-0' : 'right-0';
  const buttonLeftOffset = isOpen ? 'min(25%, 200px)' : '0';
  const buttonRightOffset = isOpen ? 'calc(min(25%, 200px) - 2rem)' : '1rem';

  return (<button
      aria-label={`${isOpen ? 'Fechar' : 'Abrir'} painel ${isLeft ? 'esquerdo' : 'direito'}`}
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className={`absolute cursor-pointer ${buttonPosition} top-1 z-20 w-8 h-8 flex items-center justify-center text-xs rounded-md hover:opacity-100 transition-all translate-x-0 text-gray-800 hover:text-white shadow-xl shadow-black/20 opacity-50`}
      style={{ [side]: isLeft ? buttonLeftOffset : buttonRightOffset }}
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
      <ToggleButton side={side} isOpen={isOpen} setOpen={setOpen} />
      <Aside isOpen={isOpen}>
        {children}
      </Aside>
    </>
  );
}