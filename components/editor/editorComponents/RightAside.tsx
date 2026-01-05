import { useState, useEffect, useRef } from 'react';
import { Brain, ArrowRightFromLine } from 'lucide-react';

const MAX_WIDTH_PERCENT = 0.5;
const DEFAULT_WIDTH = 200;
const AUTO_CLOSE_THRESHOLD = 50;

interface ToggleButtonProps {
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function ToggleButton({ isOpen, setOpen }: ToggleButtonProps) {
  const positionClasses = isOpen 
    ? "left-2 top-1" // Dentro do painel quando aberto
    : "-left-[50px] top-1"; // 15px fora quando fechado
  
  return (
    <button
      aria-label={`${isOpen ? 'Fechar' : 'Abrir'} painel direito`}
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
      className={`absolute z-20 w-8 h-8 flex items-center justify-center text-xs rounded-md hover:opacity-100 transition-all text-gray-800 hover:text-white shadow-xl shadow-black/20 opacity-50 cursor-pointer ${positionClasses}`}
    >
      {isOpen ? <ArrowRightFromLine color="#1e2939" /> : <Brain color="#1e2939" />}
    </button>
  );
}

interface AsideProps {
  isOpen: boolean;
  children: React.ReactNode;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  width: number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
}

function Aside({ isOpen, children, setIsOpen, width, setWidth }: AsideProps) {
    const asideRef = useRef<HTMLElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const aside = asideRef.current;
        if (!aside) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!isDraggingRef.current) return;
            event.preventDefault();
            
            const mousePos = event.clientX;
            const windowWidth = window.innerWidth;
            const newWidth = Math.min(
                windowWidth * MAX_WIDTH_PERCENT, 
                windowWidth - mousePos
            );
            
            // Atualiza DOM diretamente sem re-render
            aside.style.width = `${newWidth}px`;
            
            if(newWidth < AUTO_CLOSE_THRESHOLD) {
                isDraggingRef.current = false;
                aside.classList.remove('transition-none');
                document.body.style.userSelect = '';
                setIsOpen(false);
            }
        };

        const handleMouseUp = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            
            // Restaura transição e persiste o valor final no state
            aside.classList.remove('transition-none');
            document.body.style.userSelect = '';
            
            const currentWidth = parseInt(aside.style.width);
            if (!isNaN(currentWidth)) {
                setWidth(currentWidth);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setIsOpen]);

    const handleMouseDown = () => {
        isDraggingRef.current = true;
        // Remove transição durante o drag
        if (asideRef.current) {
            asideRef.current.classList.add('transition-none');
        }
        // Previne seleção de texto acidental
        document.body.style.userSelect = 'none';
    };

    return (
        <aside
            ref={asideRef}
            className="bg-gray-100 transition-all duration-300 ease-in-out relative"
            style={{ width: isOpen ? `${width}px` : '0px' }}
        >
            <ToggleButton isOpen={isOpen} setOpen={setIsOpen} />
            <div 
                className='bg-gray-800 hover:bg-red-800 w-1 h-full cursor-col-resize absolute left-0 z-10'
                onMouseDown={handleMouseDown}
            ></div>
            <div className={`h-full ${isOpen ? 'pl-6 pt-4' : 'p-0'}`}>
                {isOpen && children}
            </div>
        </aside>
    );
}

interface RightColumnProps {
  children: React.ReactNode;
}

const storageKey = 'sideColumn-right-isOpen';
const storageKeyWidth = 'sideColumn-right-width';

export default function RightColumn({ children }: RightColumnProps) {
  const [isOpen, setOpen] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      setOpen(stored === 'true');
    }
    
    const storedWidth = sessionStorage.getItem(storageKeyWidth);
    if (storedWidth !== null) {
      const parsedWidth = parseInt(storedWidth);
      if (!isNaN(parsedWidth)) {
        setWidth(parsedWidth > AUTO_CLOSE_THRESHOLD ? parsedWidth : DEFAULT_WIDTH);
      }
    }
  }, []);
  
  useEffect(() => {
    sessionStorage.setItem(storageKey, isOpen ? 'true' : 'false');
  }, [isOpen]);
  
  useEffect(() => {
    sessionStorage.setItem(storageKeyWidth, width.toString());
  }, [width]);
  
  return (
    <Aside isOpen={isOpen} setIsOpen={setOpen} width={width} setWidth={setWidth}>
      {children}
    </Aside>
  );
}
