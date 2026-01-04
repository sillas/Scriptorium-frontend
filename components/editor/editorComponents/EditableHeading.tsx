'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { handleClick, setCursorAt } from '@/lib/editor/selection';
import { styles } from '@/components/editor/styles/editable-heading';

export interface EditableHeadingHandle {
  focus: () => void;
  getTextContent: () => string;
}

interface EditableHeadingProps {
  content: string | undefined;
  level: 'title' | 'subtitle';
  isDocumentLevel: boolean;
  onInput: () => void;
  onFinishEditing: () => void;
  className?: string;
}

export const EditableHeading = forwardRef<EditableHeadingHandle, EditableHeadingProps>(
  function EditableHeading({
    content,
    level,
    isDocumentLevel,
    onInput,
    onFinishEditing,
    className = '',
  }, forwardedRef) {
    const IS_TITLE = level === 'title';
    const EMPTY_TEXT_PLACEHOLDER = IS_TITLE ? 'Insert a Title' : 'Add a subtitle';
    const Component = IS_TITLE ? 'h1' : 'h2';

    const ref = useRef<HTMLHeadingElement>(null);
    const focusByClick = useRef(false);
    const mouseXPositionRef = useRef<number | null>(null);

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

    const handleMouseDown = (event: React.MouseEvent<HTMLHeadingElement>) => {      
      focusByClick.current = true
      mouseXPositionRef.current = event.clientX;
    }

    const handleHeadingClick = useCallback((event: React.MouseEvent<HTMLHeadingElement>) => {

      if (event.detail === 2) {
        mouseXPositionRef.current = null;
        return;
      }

      if(mouseXPositionRef.current) {
        const distance = Math.abs(event.clientX - mouseXPositionRef.current);
        if(distance > 5) {
          mouseXPositionRef.current = null;
          return;
        }
      }

      event.preventDefault();
      handlePlaceholderText();
      handleClick(event, ref);
      focusByClick.current = false;
    }, [handlePlaceholderText]);

    const handleOnBlur = useCallback(() => {
      handlePlaceholderText(true);
      onFinishEditing();
      ref?.current?.blur();
    }, [EMPTY_TEXT_PLACEHOLDER, handlePlaceholderText]);

    const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLHeadingElement>) => {
      if(event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        handleOnBlur();
      }
    }, [handleOnBlur]);

    const handleOnFocus = useCallback(() => {
      if(focusByClick.current) return;
      handlePlaceholderText();
      setCursorAt(ref, 'END');
    }, [handlePlaceholderText]);


    useEffect(() => {
      handlePlaceholderText(content === undefined || content === '');
    }, [content, handlePlaceholderText]);

    return (
      <Component
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onMouseDown={handleMouseDown}
        onClick={handleHeadingClick}
        onInput={onInput}
        onFocus={handleOnFocus}
        onKeyUp={handleKeyUp}
        onBlur={handleOnBlur}
        className={`${styles.baseStyles} ${styles.sizeStyles(IS_TITLE, isDocumentLevel)} ${className}`}
      >
        {content}
      </Component>
    );
  }
);
