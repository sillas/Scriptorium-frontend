import { RefObject, useState, useCallback } from 'react';
import { countWords } from '@/components/editor/utils/helpers';

interface UseParagraphContentParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  initialText: string;
}

interface UseParagraphContentReturn {
  characterCount: number;
  wordCount: number;
  updateContentMetrics: () => void;
}

/**
 * Hook to manage paragraph content metrics (character and word counts)
 * Updates counts when content changes
 */
export function useParagraphContent({
  paragraphRef,
  initialText,
}: UseParagraphContentParams): UseParagraphContentReturn {
  const [characterCount, setCharacterCount] = useState(initialText?.trim().length || 0);
  const [wordCount, setWordCount] = useState(countWords(initialText));

  const updateContentMetrics = useCallback(() => {
    const text = paragraphRef.current?.innerText?.trim() || '';
    setCharacterCount(text.length);
    setWordCount(countWords(text));
  }, [paragraphRef]);

  return {
    characterCount,
    wordCount,
    updateContentMetrics,
  };
}
