import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { styles } from '@/components/editor/styles/paragraph';
import type { ContentMetrics } from '@/hooks/editor/paragraphs/useParagraphContent';

export interface ParagraphIndicatorsHandle {
  setMetrics: (metrics: ContentMetrics) => void;
}

interface ParagraphIndicatorsProps {
  paragraphIndex: number;
  cursorPosition: number;
  isEditing: boolean;
  initialMetrics: ContentMetrics;
}

const ParagraphIndicators = forwardRef<ParagraphIndicatorsHandle, ParagraphIndicatorsProps>(
  ({ paragraphIndex, cursorPosition, isEditing, initialMetrics }, ref) => {
    const [metrics, setMetrics] = useState<ContentMetrics>(initialMetrics);

    useImperativeHandle(ref, () => ({ setMetrics }), [setMetrics]);

    useEffect(() => {
      setMetrics(initialMetrics);
    }, [initialMetrics]);

    return (
      <span className={styles.characterCountStyle(isEditing)}>
        {paragraphIndex + 1}° parágrafo • Col: {cursorPosition}
        {isEditing && ` • ${metrics.characterCount} chars`} • {metrics.wordCount} words
      </span>
    );
  }
);

ParagraphIndicators.displayName = 'ParagraphIndicators';

export default ParagraphIndicators;
