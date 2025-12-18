'use client';

import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick } from '@/components/editor/utils/utils';
import { useParagraph } from '@/hooks/useParagraph';

export interface ParagraphUpdate {
  text: string;
  characterCount: number;
  wordCount: number;
  isQuote: boolean;
  isHighlighted: boolean;
  updatedAt: Date;
}
interface ParagraphProps {
  paragraph: ParagraphInterface;
  focusActivation?: { direction: NavigationDirection } | null;
  navigation: {
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    isTheLastParagraphInChapter: boolean;
  };
  onTextChange: (paragraph: ParagraphInterface, updatedText: ParagraphUpdate) => void;
  onNavigate: (direction: NavigationDirection) => void;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  onRemoteSync: () => void;
  createNewParagraphAbove: () => void;
  createNewParagraphInChapter: () => void;
}

export function Paragraph({
  paragraph,
  focusActivation,
  navigation,
  onTextChange,
  onNavigate,
  onDelete,
  onReorder,
  onRemoteSync,
  createNewParagraphAbove,
  createNewParagraphInChapter,
}: ParagraphProps) {
  const {
    paragraphRef,
    isEditing,
    setIsEditing,
    isQuote,
    isHighlighted,
    isCursorAtFirstPosition,
    isCursorAtLastPosition,
    characterCount,
    wordCount,
    handleKeyDown,
    handleFinishEditing,
    scheduleAutoSave,
    handleDeleteAction,
    toggleQuote,
    toggleHighlight,
  } = useParagraph({
    paragraph,
    focusActivation,
    navigation,
    onTextChange,
    onNavigate,
    onDelete,
    onReorder,
    onRemoteSync,
    createNewParagraphInChapter,
  });

  /**
   * Handles click events on the paragraph element.
   */
  const handleParagraphClick = (event: React.MouseEvent<HTMLDivElement>) => {
    handleClick(event, paragraphRef, isEditing, setIsEditing);
  };

  const buttons_actions = [
    { label: '"',description: 'Toggle Quote', action: toggleQuote, style: 'text-5xl text-gray-500' },
    { label: '★',description: 'Toggle Highlight', action: toggleHighlight, style: 'text-lg text-yellow-500' },
    { label: 'X',description: 'Delete Paragraph', action: handleDeleteAction, style: 'text-2xs text-red-400 font-bold' },
  ];

  return (
    <>
      <button 
        onClick={createNewParagraphAbove}
        aria-label="Add Paragraph Here" 
        className='relative flex items-center justify-center box-border w-full cursor-pointer border-2 border-transparent hover:border-dashed hover:border-slate-400/30 hover:rounded-t-md hover:text-gray-400 transition-colors duration-200'>
      +
      </button>
      <div className="relative flex flex-row items-stretch">
        {/* Botões laterais à esquerda, fora do fluxo do texto */}
        <div
          className={
            `flex flex-col items-center justify-center z-10 select-none transition-opacity duration-200 ` +
            `absolute -left-[2rem] top-0 h-full min-w-[2rem] ` +
            `${isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
          }
        >
          {buttons_actions.map(({ label, description, action, style }) => (
            <button
              key={label}
              tabIndex={-1}
              aria-label={description}
              className={`${isEditing ? 'pointer-events-auto' : 'pointer-events-none'} my-0.5 w-6 h-6 ${style} rounded bg-slate-100 border border-slate-200 shadow-sm hover:bg-slate-200 focus:outline-none cursor-pointer`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Parágrafo editável */}
        <div className={`${isEditing ? (isHighlighted ? 'border-4 border-yellow-200 shadow-sm' : 'bg-slate-200 shadow-sm'): (isHighlighted? 'bg-yellow-100 shadow-sm' : '')} rounded-md px-3 mb-1 text-slate-800 relative flex-1`}>  
          
          {isCursorAtFirstPosition && navigation.canNavigatePrevious && (
            <span className="absolute left-0 top-0 text-gray-400 -translate-y-1/2">▲</span>
          )}

          {isQuote && (
            <div className="absolute pl-[3.5rem] left-0 top-0 text-gray-400 text-5xl select-none pointer-events-none" aria-hidden="true">
              “
            </div>
          )}

          <div
            ref={paragraphRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onClick={handleParagraphClick}
            onBlur={handleFinishEditing}
            onInput={scheduleAutoSave}
            onKeyDown={handleKeyDown}
            className={`${isEditing ? 'rounded':( paragraph.text.length === 0 ? 'bg-slate-200' : '')} ${isQuote ? 'pl-[4rem] italic text-gray-600' : ''} pr-2 cursor-text min-h-[1.5rem] outline-none text-justify`}
          >
            {paragraph.text}
          </div>

          { isEditing && (
            <span className="absolute right-0 bottom-0 text-gray-400 bg-slate-100 rounded px-2 translate-y-1/2">
              {characterCount} chars • {wordCount} words
            </span>
          )}

          {isCursorAtLastPosition && navigation.canNavigateNext && (
            <span className="absolute left-0 bottom-0 text-gray-400 translate-y-1/2">▼</span>
          )}
        
          <div className="absolute top-0 right-0">
            <SyncIndicator isSynced={paragraph.sync} />
          </div>
        </div>
      </div>
    </>
  );
}
