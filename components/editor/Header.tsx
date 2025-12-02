export default function EditorHeader({ slug }: { slug: string }) {
    return (<header className="w-full h-14 bg-slate-700 flex items-center px-4 z-10">
        <div className="text-white text-sm">Document {slug}</div>
      </header>);
}