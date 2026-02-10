import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { styles } from '@/components/editor/styles/paragraph';
import type { ContentMetrics } from '@/hooks/editor/paragraphs/useParagraphContent';

export interface ParagraphIndicatorsHandle {
  setMetrics: (metrics: ContentMetrics) => void;
  setCursorPosition: (position: number) => void;
}

interface ParagraphIndicatorsProps {
  paragraphIndex: number;
  isEditing: boolean;
  initialMetrics: ContentMetrics;
}

const ParagraphIndicators = forwardRef<ParagraphIndicatorsHandle, ParagraphIndicatorsProps>(
  ({ paragraphIndex, isEditing, initialMetrics }, ref) => {
    const [metrics, setMetrics] = useState<ContentMetrics>(initialMetrics);
    const [cursorPosition, setCursorPosition] = useState(0);

    useImperativeHandle(ref, () => ({ setMetrics, setCursorPosition }), [setMetrics, setCursorPosition]);

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
