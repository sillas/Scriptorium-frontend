interface Chapter {
  id: string;
  index: number;
  title: string;
}

interface ContentsProps {
  chapters: Chapter[];
}

export default function Contents({ chapters }: ContentsProps) {
  const sortedChapters = [...chapters].sort((a, b) => a.index - b.index);

  const scrollToChapter = (chapterId: string) => {
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-slate-600 rounded-lg p-4">
      <h3 className="text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wide">
        Contents
      </h3>
      <nav className="space-y-0">
        {sortedChapters.map((chapter, idx) => (
          <button
            key={chapter.id}
            onClick={() => scrollToChapter(chapter.id)}
            className="w-full text-left group hover:bg-slate-500 rounded px-3 py-0 transition-colors"
            title={chapter.title}
          >
            <div className="flex items-start gap-2 text-slate-200">
              <span className="text-slate-400 font-medium min-w-[1.5rem] group-hover:text-slate-300">
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm group-hover:text-white">
                {chapter.title}
              </span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
