import { useCallback, useState } from 'react';
import { getSelection } from '@/lib/editor/selection';

interface UseParagraphContextMenuParams {
  isEditing: boolean;
  setSelection: (selection: Selection | null) => void;
}

interface UseParagraphContextMenuReturn {
  horizontalPosition: number;
  handleRightClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Hook to manage paragraph context menu (right-click)
 * Handles positioning and selection for context menu
 */
export function useParagraphContextMenu({
  isEditing,
  setSelection,
}: UseParagraphContextMenuParams): UseParagraphContextMenuReturn {
  const [horizontalPosition, setHorizontalPosition] = useState(0);

  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditing) return;
      event.preventDefault();

      if (event.button !== 2) return;
      const currentSelection = getSelection(event);

      if (currentSelection) {
        // Calculate horizontal position for context menu
        const maxRightPosition = 200;
        const targetBounds = event.currentTarget.getBoundingClientRect();
        let xRelative = event.clientX - targetBounds.left;
        
        // Prevent menu from going off-screen on the right
        if (targetBounds.width - xRelative < maxRightPosition) {
          xRelative = targetBounds.width - maxRightPosition;
        }
        
        setHorizontalPosition(xRelative);
        setSelection(currentSelection);
      }
    },
    [isEditing, setSelection]
  );

  return {
    horizontalPosition,
    handleRightClick,
  };
}
