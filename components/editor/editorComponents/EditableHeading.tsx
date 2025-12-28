'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { handleClick } from '@/components/editor/utils/utils';

export interface EditableHeadingHandle {
  focus: () => void;
  getTextContent: () => string;
}

interface EditableHeadingProps {
  content: string;
  level: 'title' | 'subtitle';
  isDocumentLevel: boolean;
  onInput: () => void;
  onFinishEditing: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLHeadingElement>) => void;
  className?: string;
}

export const EditableHeading = forwardRef<EditableHeadingHandle, EditableHeadingProps>(
  function EditableHeading({
    content,
    level,
    isDocumentLevel,
    onInput,
    onFinishEditing,
    onKeyDown,
    className = '',
  }, forwardedRef) {
    const IS_TITLE = level === 'title';
    const EMPTY_TEXT_PLACEHOLDER = IS_TITLE ? 'Insert a Title' : 'Add a subtitle';
    const ref = useRef<HTMLHeadingElement>(null);

    /**
     * Expose imperative methods to parent components
     */
    useImperativeHandle(forwardedRef, () => ({
      focus: () => ref.current?.focus(),
      getTextContent: () => {
        const text = ref.current?.textContent?.trim() || ''
        return text === EMPTY_TEXT_PLACEHOLDER ? '' : text;
      },
    }), [EMPTY_TEXT_PLACEHOLDER]);

    const handlePlaceholderText = useCallback((add_placeholder: boolean = false) => {
      if(!ref.current) return;
      const text = ref.current.textContent.trim() || '';
      
      if(add_placeholder && text === '') {
        ref.current.textContent = EMPTY_TEXT_PLACEHOLDER;
        return;
      }

      if(!add_placeholder && text === EMPTY_TEXT_PLACEHOLDER) {
        ref.current.textContent = '';
      }
    }, [EMPTY_TEXT_PLACEHOLDER]);

    useEffect(() => {
      if(!ref.current) return;
      const element = ref.current;
        element.addEventListener('focus', () => handlePlaceholderText());
      return () => {
        element.removeEventListener('focus', () => handlePlaceholderText());
      };
    }, [handlePlaceholderText]);

    const handleHeadingClick = useCallback((event: React.MouseEvent<HTMLHeadingElement>) => {
      handlePlaceholderText();
      handleClick(event, ref);
    }, [handlePlaceholderText]);

    const handleOnBlur = useCallback(() => {
      handlePlaceholderText(true);
      onFinishEditing();
      ref?.current?.blur();
    }, [EMPTY_TEXT_PLACEHOLDER, handlePlaceholderText]);

    const sizeStyles = IS_TITLE
        ? isDocumentLevel ? 'text-3xl font-bold text-slate-900' : 'text-xl font-semibold text-slate-800'
        : isDocumentLevel ? 'text-lg mt-2 text-slate-600' : 'text-sm mt-1 text-slate-600';
    const baseStyles = 'cursor-text flex-1 outline-none focus:bg-slate-200 focus:shadow-sm focus:rounded focus:px-1';
    const Component = IS_TITLE ? 'h1' : 'h2';

    return (
      <Component
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onClick={handleHeadingClick}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onBlur={handleOnBlur}
        className={`${baseStyles} ${sizeStyles} ${className}`}
      >
        {content}
      </Component>
    );
  }
);
