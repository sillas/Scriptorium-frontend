import { useState, useEffect } from 'react';
import { ListTree, ArrowLeftFromLine } from 'lucide-react';

interface ToggleButtonProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ToggleButton({ isOpen, setOpen }: ToggleButtonProps) {
  const getArrowIcon = () => {
    return isOpen ? <ArrowLeftFromLine color="#1e2939" /> : <ListTree color="#1e2939" />;
  }

  const buttonLeftOffset = isOpen ? 'min(25%, 200px)' : '0';

  return (
    <button
      aria-label={`${isOpen ? 'Fechar' : 'Abrir'} painel esquerdo`}
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className="absolute cursor-pointer left-0 top-1 z-20 w-8 h-8 flex items-center justify-center text-xs rounded-md hover:opacity-100 transition-all translate-x-0 text-gray-800 hover:text-white shadow-xl shadow-black/20 opacity-50"
      style={{ left: buttonLeftOffset }}
    >
      {getArrowIcon()}
    </button>
  );
}

interface AsideProps {
  isOpen: boolean;
  children: React.ReactNode;
}

function Aside({ isOpen, children }: AsideProps) {
  return (
    <aside
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

interface LeftColumnProps {
  children: React.ReactNode;
}

export default function LeftColumn({ children }: LeftColumnProps) {
  const storageKey = 'sideColumn-left-isOpen';
  const [isOpen, setOpen] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      setOpen(stored === 'true');
    }
  }, []);
  
  useEffect(() => {
    sessionStorage.setItem(storageKey, isOpen ? 'true' : 'false');
  }, [isOpen]);
  
  return (
    <>
      <ToggleButton isOpen={isOpen} setOpen={setOpen} />
      <Aside isOpen={isOpen}>
        {children}
      </Aside>
    </>
  );
}