import { EditorToggleButtons } from '@/components/editor/editorComponents/toggleButtons';

export function SideColumn({ side, isOpen, setOpen, children }: { side: "left" | "right", isOpen: boolean, setOpen: (open: boolean) => void, children: React.ReactNode }) {
  return (
    <>
      <EditorToggleButtons side={side} isOpen={isOpen} setOpen={setOpen} />
      
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