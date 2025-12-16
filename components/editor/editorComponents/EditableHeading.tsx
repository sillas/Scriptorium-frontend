'use client';

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
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
    const [isEditing, setIsEditing] = useState(false);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        setIsEditing(true);
        ref.current?.focus();
      },
      getTextContent: () => {
        return ref.current?.textContent?.trim() || '';
      },
    }));

    const handleHeadingClick = useCallback((e: React.MouseEvent<HTMLHeadingElement>) => {
      handleClick(e, ref, isEditing, setIsEditing);
    }, [isEditing]);

    const handleHeadingKeyDown = useCallback((e: React.KeyboardEvent<HTMLHeadingElement>) => {
      const shouldStop = onKeyDown?.(e);
      if (!shouldStop && ['Tab', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        onFinishEditing();
        setIsEditing(false);
      }
    }, [onKeyDown, onFinishEditing]);

    const handleBlur = useCallback(() => {
      onFinishEditing();
      setIsEditing(false);
    }, [onFinishEditing]);

    const baseStyles = `cursor-text flex-1 outline-none ${isEditing ? 'bg-slate-200 shadow-sm rounded px-1' : ''}`;
    
    const sizeStyles = level === 'title'
      ? isDocumentLevel
        ? 'text-3xl font-bold text-slate-900'
        : 'text-xl font-semibold text-slate-800'
      : isDocumentLevel
        ? 'text-lg mt-2 text-slate-600'
        : 'text-sm mt-1 text-slate-600';

    const Component = level === 'title' ? 'h1' : 'h2';

    return (
      <Component
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleHeadingClick}
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
