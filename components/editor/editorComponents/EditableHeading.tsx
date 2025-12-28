'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { handleClick } from '@/components/editor/utils/utils';
import { EditableHeadingStyles as styles } from '@/components/editor/utils/editableHeadingStyles';

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

    const handleHeadingClick = useCallback((event: React.MouseEvent<HTMLHeadingElement>) => {
      handlePlaceholderText();
      handleClick(event, ref);
    }, [handlePlaceholderText]);

    const handleOnBlur = useCallback(() => {
      handlePlaceholderText(true);
      onFinishEditing();
      ref?.current?.blur();
    }, [EMPTY_TEXT_PLACEHOLDER, handlePlaceholderText]);

    useEffect(() => {
      handlePlaceholderText(content === undefined || content === '');
    }, [content, handlePlaceholderText]);

    return (
      <Component
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onClick={handleHeadingClick}
        onInput={onInput}
        onFocus={() => handlePlaceholderText()}
        onBlur={handleOnBlur}
        className={`${styles.baseStyles} ${styles.sizeStyles(IS_TITLE, isDocumentLevel)} ${className}`}
      >
        {content}
      </Component>
    );
  }
);
