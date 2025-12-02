/* Botão Toggle Esquerda */
/* <button
    onClick={() => setLeftOpen(!leftOpen)}
    className={`absolute left-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
    leftOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
    }`}
    style={{ left: leftOpen ? 'calc(25% - 2rem)' : '0' }}
>
    {leftOpen ? '◀' : '▶'}
</button> */

/* Botão Toggle Direita */
/*<button
    onClick={() => setRightOpen(!rightOpen)}
    className={`absolute right-0 top-0 z-20 text-white w-8 h-8 flex items-center justify-center text-xs hover:opacity-100 transition-all ${
    rightOpen ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-0'
    }`}
    style={{ right: rightOpen ? 'calc(25% - 2rem)' : '0' }}
>
    {rightOpen ? '▶' : '◀'}
</button>
*/

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