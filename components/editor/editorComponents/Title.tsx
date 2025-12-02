'use client';

import { useRef, useState } from 'react';

interface TitleProps {
  title: string;
  subtitle?: string;
  // documentId: string;
  chapterId?: string;
  metadata?: {
    version?: number;
    updatedAt?: Date;
    [key: string]: any;
  };
  onTitleChange?: (newTitle: string) => void;
  onSubtitleChange?: (newSubtitle: string) => void;
}

export default function Title({
  title,
  subtitle,
  // documentId,
  chapterId,
  metadata,
  onTitleChange,
  onSubtitleChange,
}: TitleProps) {
  const isMainTitle = !chapterId;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleSubtitleClick = () => {
    setIsEditingSubtitle(true);
    setTimeout(() => subtitleRef.current?.focus(), 0);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (onTitleChange && titleRef.current) {
      const newTitle = titleRef.current.textContent || '';
      if (newTitle !== title) {
        onTitleChange(newTitle);
      }
    }
  };

  const handleSubtitleBlur = () => {
    setIsEditingSubtitle(false);
    if (onSubtitleChange && subtitleRef.current) {
      const newSubtitle = subtitleRef.current.textContent || '';
      if (newSubtitle !== subtitle) {
        onSubtitleChange(newSubtitle);
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIsEditingTitle(false);
      if (subtitle) {
        setIsEditingSubtitle(true);
        setTimeout(() => subtitleRef.current?.focus(), 0);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIsEditingSubtitle(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div
      className={`${
        isMainTitle
          ? 'bg-slate-200 p-6 mb-6 rounded-lg'
          : 'bg-slate-100 p-4 mb-3 rounded-md'
      } shadow-sm`}
    >
      <h1
        ref={titleRef}
        contentEditable={isEditingTitle}
        suppressContentEditableWarning
        onClick={handleTitleClick}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
        className={`${
          isMainTitle
            ? 'text-3xl font-bold text-slate-900'
            : 'text-xl font-semibold text-slate-800'
        } ${isEditingTitle ? 'outline outline-2 outline-blue-500 rounded px-1' : 'cursor-pointer'}`}
      >
        {title}
      </h1>
      {subtitle && (
        <h2
          ref={subtitleRef}
          contentEditable={isEditingSubtitle}
          suppressContentEditableWarning
          onClick={handleSubtitleClick}
          onBlur={handleSubtitleBlur}
          onKeyDown={handleSubtitleKeyDown}
          className={`${
            isMainTitle
              ? 'text-lg text-slate-600 mt-2'
              : 'text-sm text-slate-600 mt-1'
          } ${isEditingSubtitle ? 'outline outline-2 outline-blue-500 rounded px-1' : 'cursor-pointer'}`}
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
