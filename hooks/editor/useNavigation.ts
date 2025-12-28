import { useCallback } from "react";
import { ActiveParagraphInterface, NavigationDirection, ParagraphInterface } from "@/components/editor/utils/interfaces";

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
    
        if( direction === 'Up' ) newParagraphIndex--;
        else if (direction === 'Down') newParagraphIndex++;

        const nextParagraph = paragraphs[newParagraphIndex];

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

    /**
     * Handle tab navigation from chapter subtitle to first paragraph.
     * 
     * @param chapters - array of chapters in the document
     * @param chapterIndex - index of the current chapter
     * @param paragraphs - array of paragraphs in the current chapter
     * @param setActiveParagraph - function to set the active paragraph for focus/navigation
     * @returns boolean indicating if navigation was successful
     */
    // const onSubtitleTab = useCallback((
    //     chapters: ChapterInterface[], 
    //     chapterIndex: number, 
    //     paragraphs: ParagraphInterface[], 
    //     setActiveParagraph: (value: { id: string; direction: NavigationDirection } | null) => void
    // ): boolean => {
    //     if (paragraphs.length === 0) {
    //       return false;
    //     }
    //     // navigateToAdjacentParagraph(chapters, chapterIndex, -1, 'Down', setActiveParagraph);
    //     return true;
    //   }, [navigateToAdjacentParagraph]);


    return {
        navigateToAdjacentParagraph,
        getNavigationAvailability,
        // onSubtitleTab
    };
}