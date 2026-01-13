import { RefObject, useState, useCallback } from 'react';
import { countWords, countCharacters } from '@/lib/editor/text-utils';

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
  
  const [characterCount, setCharacterCount] = useState(countCharacters((initialText)));
  const [wordCount, setWordCount] = useState(countWords(initialText));
  
  const updateContentMetrics = useCallback(() => {    
    const text = (paragraphRef.current?.textContent || '').trim();
    setCharacterCount(countCharacters(text));
    setWordCount(countWords(text));
  }, []);

  return {
    characterCount,
    wordCount,
    updateContentMetrics,
  };
}
