import { useCallback } from "react";
import { 
  ActiveParagraphInterface, 
  NavigationDirection, 
  ParagraphInterface
} from "@/components/editor/utils/interfaces";

export function useNavigation() {
    /**
       * Activate the next or previous paragraph for focus/navigation.
       * Calculates boundaries across chapters and sets `activeParagraph` accordingly.
       * If navigation reaches outside the document bounds, clears the active paragraph.
       *
       * @param chapterIndex - index of the current chapter
       * @param paragraphIndex - index of the current paragraph within the chapter
       * @param direction - 'Up' or 'Down' to indicate navigation direction
       */
      const navigateToAdjacentParagraph = useCallback((
        event: React.KeyboardEvent<HTMLDivElement>,
        direction: NavigationDirection,
        paragraphIndex: number,
        paragraphs: ParagraphInterface[] | undefined,
        setActiveParagraph: (value: ActiveParagraphInterface | null) => void
      ) => {
        if (!paragraphs || direction === null) {
          setActiveParagraph(null);
          return;
        }

        if(paragraphIndex <= 0 && direction === 'Up') return;
        if(paragraphIndex >= paragraphs.length - 1 && direction === 'Down') return;
        
        let newParagraphIndex = paragraphIndex;
        const currentParagraph = paragraphs[paragraphIndex];
    
        if( direction === 'Up' ) newParagraphIndex--;
        else if (direction === 'Down') newParagraphIndex++;

        const nextParagraph = paragraphs[newParagraphIndex];

        if(event.key === 'Tab') {
          if(currentParagraph.chapterId !== nextParagraph.chapterId) {
            // crossing chapter boundary on Tab
            setActiveParagraph(null);
            return;
          }
          direction = 'Up';
        }

        setActiveParagraph({
          id: nextParagraph.id,
          direction
        });
      }, []);

    const getNavigationAvailability = useCallback((paragraphIndex: number, paragraphs: ParagraphInterface[]) => {
      return {
        canNavigatePrevious: paragraphIndex > 0,
        canNavigateNext: paragraphIndex < paragraphs.length -1,
        isTheLastParagraphInChapter: paragraphs[paragraphIndex].chapterId !== paragraphs[paragraphIndex + 1]?.chapterId
      }
    }, []);


    return {
        navigateToAdjacentParagraph,
        getNavigationAvailability,
    };
}