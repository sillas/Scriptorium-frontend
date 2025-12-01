interface TitleProps {
  title: string;
  subtitle?: string;
  documentId: string;
  chapterId?: string;
  metadata?: {
    version?: number;
    updatedAt?: Date;
    [key: string]: any;
  };
}

export default function Title({
  title,
  subtitle,
  documentId,
  chapterId,
  metadata,
}: TitleProps) {
  const isMainTitle = !chapterId;

  return (
    <div
      className={`${
        isMainTitle
          ? 'bg-slate-200 p-6 mb-6 rounded-lg'
          : 'bg-slate-100 p-4 mb-3 rounded-md'
      } shadow-sm`}
    >
      <h1
        className={`${
          isMainTitle
            ? 'text-3xl font-bold text-slate-900'
            : 'text-xl font-semibold text-slate-800'
        }`}
      >
        {title}
      </h1>
      {subtitle && (
        <h2
          className={`${
            isMainTitle
              ? 'text-lg text-slate-600 mt-2'
              : 'text-sm text-slate-600 mt-1'
          }`}
        >
          {subtitle}
        </h2>
      )}
      {metadata && (
        <div className="mt-2 text-xs text-slate-500">
          {metadata.version && <span>v{metadata.version}</span>}
          {metadata.updatedAt && (
            <span className="ml-2">
              Updated: {metadata.updatedAt.toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
