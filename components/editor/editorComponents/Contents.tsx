interface Chapter {
  id: string;
  index: number;
  title: string;
}

interface ContentsProps {
  chapters: Chapter[];
}

export default function Contents({ chapters }: ContentsProps) {

  const scrollToChapter = (chapterId: string) => {
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <h3 className="text-gray-800 font-semibold mb-4 text-sm uppercase tracking-wide">
        Contents
      </h3>
      <nav className="space-y-0">
        {chapters.map((chapter, idx) => (
          <button
            key={chapter.id}
            onClick={() => scrollToChapter(chapter.id)}
            className="w-full text-left group rounded p-0 transition-colors cursor-pointer"
            title={chapter.title}
          >
            <div className="flex items-start gap-2 text-gray-800">
              <span className="text-gray-500 font-medium min-w-[5px] group-hover:text-gray-700">
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm group-hover:text-gray-900">
                {chapter.title}
              </span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
