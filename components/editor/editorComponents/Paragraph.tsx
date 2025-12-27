'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { NavigationDirection, ParagraphInterface } from '@/components/editor/utils/interfaces';
import SyncIndicator from '@/components/editor/SyncIndicator';
import { handleClick, handleRightClick } from '@/components/editor/utils/utils';
import { countWords } from '@/components/editor/utils/helpers';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { handleDeleteQuestion } from '@/components/editor/utils/utils';

// import { useParagraph } from '@/hooks/useParagraph';

const DEBOUNCE_DELAY_MS = 700;
const EMPTY_TEXT_PLACEHOLDER = 'Clique para editar este parágrafo...';
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
  onDelete?: () => void;
  // onNavigate?: (direction: NavigationDirection) => void;
  // onReorder?: (direction: 'up' | 'down') => void;
  // onRemoteSync?: () => void;
  // createNewParagraphAbove?: () => void;
  // createNewParagraphInChapter?: () => void;
}

export function Paragraph({
  paragraph, navigation, onDelete
}: ParagraphProps) {

  const { paragraphLocalSave, deleteParagraph } = useLocalStorage();

  // const {
  //   paragraphRef,
  //   isEditing,
  //   setIsEditing,
  //   isQuote,
  //   isHighlighted,
  //   isCursorAtFirstPosition,
  //   isCursorAtLastPosition,
  //   characterCount,
  //   wordCount,
  //   handleKeyDown,
  //   handleFinishEditing,
  //   scheduleAutoSave,
  //   handleDeleteAction,
  //   toggleQuote,
  //   toggleHighlight,
  // } = useParagraph({
  //   paragraph,
  //   focusActivation,
  //   navigation,
  //   onTextChange,
  //   onNavigate,
  //   onDelete,
  //   onReorder,
  //   onRemoteSync,
  //   createNewParagraphInChapter,
  // });

  
  const isCursorAtFirstPosition = false;
  const isCursorAtLastPosition = false;
  
  const paragraphRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef(paragraph.text);

  const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
  const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);    
  const [isEditing, setIsEditing] = useState(false);
  const [characterCount, setCharacterCount] = useState(paragraph.text?.trim().length || 0);
  const [wordCount, setWordCount] = useState(countWords(paragraph.text));

  // Custom hooks
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();

  // Effect to set initial content
  useEffect(() => {
    if (paragraphRef.current) {
      if (paragraph.text === '') {
        paragraphRef.current.innerHTML = EMPTY_TEXT_PLACEHOLDER;
      } else {
        paragraphRef.current.innerHTML = paragraph.text;
      }
    }
  }, [paragraph.text]);

  // Placeholder functions -----------------
  const createNewParagraphAbove = () => {}
  // --------------------------------------

  // Local Storage Functions --------------
  const triggerLocalSave = useCallback(async (forceUpdate = false) => {

      let newText = paragraphRef.current?.textContent?.trim() || '';
      if(newText === EMPTY_TEXT_PLACEHOLDER) newText = ''

      if (!forceUpdate && newText === previousTextRef.current) return;
      previousTextRef.current = newText;

      console.log('newText.length: ', newText.length);
      
      await paragraphLocalSave(paragraph, {
        text: newText,
        characterCount: newText.length,
        wordCount: countWords(newText),
        isQuote: isQuote || false,
        isHighlighted: isHighlighted || false,
        updatedAt: new Date(),
      });
  }, [paragraph, isQuote, isHighlighted]);

  const handleFinishEditing = useCallback(async () => {
    setIsEditing(false);
  
    const text = paragraphRef.current!.textContent.trim() || '';    
    if(text.length === 0) paragraphRef.current!.textContent = EMPTY_TEXT_PLACEHOLDER;

    await triggerLocalSave();
    paragraphRef.current?.blur();
  }, [triggerLocalSave, isEditing]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {}

  const handleParagraphClick = (event: React.MouseEvent<HTMLDivElement>) => {
    
    if(!paragraphRef.current) return;
    const text = paragraphRef.current?.textContent?.trim() || '';
    if(text === EMPTY_TEXT_PLACEHOLDER) {
        paragraphRef.current!.innerHTML = '';
    }

    handleClick(event, paragraphRef, isEditing, setIsEditing);
  };

  const scheduleLocalAutoSave = useCallback(() => {    
    clearDebounceTimer();
    setDebounce(triggerLocalSave, DEBOUNCE_DELAY_MS);

    const text = paragraphRef.current?.textContent?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [clearDebounceTimer, setDebounce, triggerLocalSave]);

  const handleInput = useCallback(() => {

    // const text = paragraphRef.current?.textContent?.trim() || '';

    // if (text === PLACEHOLDER_TEXT) {
    //   paragraphRef.current!.innerHTML = '';
    // }

    scheduleLocalAutoSave();
  }, [scheduleLocalAutoSave]);

  // Toggles Buttons ------------------------------
  useEffect(  () => {
    triggerLocalSave(true);
  }, [isQuote, isHighlighted]);

  const toggleQuote = useCallback(() => {
      setIsQuote(prev => !prev);
  }, []);
  
  const toggleHighlight = useCallback(() => {
    setIsHighlighted(prev => !prev);
  }, []);

  const handleDeleteAction = useCallback(() => {
    if (!onDelete) return;
    const text = paragraphRef.current?.textContent || '';
    const result = handleDeleteQuestion(text, onDelete);
    if(result) deleteParagraph(paragraph.id);
  }, [onDelete]);
  // --------------------------------------

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
      <div className="relative flex flex-row items-stretch group">
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
            contentEditable
            suppressContentEditableWarning
            onClick={handleParagraphClick}
            onContextMenu={handleRightClick}
            onBlur={handleFinishEditing}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={`${isEditing ? 'rounded':( characterCount === 0 ? 'bg-red-50' : '')} ${isQuote ? 'pl-[4rem] italic text-gray-600' : ''} pr-2 pb-4 cursor-text min-h-[1.5rem] outline-none text-justify`}
          ></div>

          <span className={`absolute right-0 bottom-0 text-gray-400 bg-slate-100 rounded px-2 translate-y-1/2 ${isEditing ? 'visible':'invisible group-hover:visible'}`}>
            {characterCount} chars • {wordCount} words
          </span>

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
