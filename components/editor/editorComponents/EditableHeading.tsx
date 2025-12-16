'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { handleContentEditableClick } from '@/components/editor/utils/utils';

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
  onKeyDown?: (e: React.KeyboardEvent<HTMLHeadingElement>) => boolean;
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
    const ref = useRef<HTMLHeadingElement>(null);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        ref.current?.focus();
      },
      getTextContent: () => {
        return ref.current?.textContent?.trim() || '';
      },
    }), []);

    const handleHeadingKeyDown = useCallback((event: React.KeyboardEvent<HTMLHeadingElement>) => {
      
        const shouldStop = onKeyDown?.(event);

        if (shouldStop) {
          event.preventDefault();
          onFinishEditing();
          ref.current?.blur();
        }
        
    }, [onKeyDown, onFinishEditing]);

    const handleBlur = useCallback(onFinishEditing, [onFinishEditing]);

    const isTitle = level === 'title';
    const sizeStyles = isTitle
        ? isDocumentLevel ? 'text-3xl font-bold text-slate-900' : 'text-xl font-semibold text-slate-800'
        : isDocumentLevel ? 'text-lg mt-2 text-slate-600' : 'text-sm mt-1 text-slate-600';
    const baseStyles = 'cursor-text flex-1 outline-none focus:bg-slate-200 focus:shadow-sm focus:rounded focus:px-1';
    const Component = isTitle ? 'h1' : 'h2';

    return (
      <Component
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onClick={(event) => handleContentEditableClick(event, ref)}
        onInput={onInput}
        onKeyDown={handleHeadingKeyDown}
        onBlur={handleBlur}
        className={`${baseStyles} ${sizeStyles} ${className}`}
      >
        {content}
      </Component>
    );
  }
);
