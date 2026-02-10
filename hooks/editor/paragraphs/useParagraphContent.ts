import { RefObject, useCallback, useMemo } from 'react';
import { countWords, countCharacters } from '@/lib/editor/text-utils';

export interface ContentMetrics {
  characterCount: number;
  wordCount: number;
}

interface UseParagraphContentParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  initialText: string;
  onMetricsChange?: (metrics: ContentMetrics) => void;
}

interface UseParagraphContentReturn {
  initialMetrics: ContentMetrics;
  updateContentMetrics: () => ContentMetrics;
}

/**
 * Hook to manage paragraph content metrics (character and word counts)
 * Updates counts when content changes
 */
export function useParagraphContent({
  paragraphRef,
  initialText,
  onMetricsChange,
}: UseParagraphContentParams): UseParagraphContentReturn {

  const initialMetrics = useMemo<ContentMetrics>(() => ({
    characterCount: countCharacters(initialText),
    wordCount: countWords(initialText),
  }), [initialText]);

  const updateContentMetrics = useCallback((): ContentMetrics => {
    const text = (paragraphRef.current?.textContent || '').trim();
    const metrics = {
      characterCount: countCharacters(text),
      wordCount: countWords(text),
    };
    onMetricsChange?.(metrics);
    return metrics;
  }, [paragraphRef, onMetricsChange]);

  return {
    initialMetrics,
    updateContentMetrics,
  };
}
