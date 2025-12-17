import { useCallback } from "react";
import { ActiveParagraphInterface, ChapterInterface, NavigationDirection, ParagraphInterface } from "@/components/editor/utils/interfaces";

const calcParagraphLength = (chapters: ChapterInterface[] | undefined, index: number): number => {
    if (!chapters) return 0;
    return chapters[index]?.paragraphs?.length ?? 0
}

export function useNavigation() {

    /**
       * Activate the next or previous paragraph for focus/navigation.
       * Calculates boundaries across chapters and sets `activeParagraph` accordingly.
       * If navigation reaches outside the document bounds, clears the active paragraph.
       *
       * @param chapterIndex - index of the current chapter
       * @param paragraphIndex - index of the current paragraph within the chapter
       * @param direction - 'previous' or 'next' to indicate navigation direction
       */
      const navigateToAdjacentParagraph = useCallback((
        chapters: ChapterInterface[] | undefined,
        chapterIndex: number,
        paragraphIndex: number,
        direction: NavigationDirection,
        setActiveParagraph: (value: ActiveParagraphInterface | null) => void
      ) => {
    
        if (!chapters || chapters.length === 0 || direction === null) {
          setActiveParagraph(null);
          return;
        }
    
        let newChapterIndex = chapterIndex;
        let newParagraphIndex = paragraphIndex;
    
        if( direction === 'previous' ) {
          newParagraphIndex--;
    
          if(newParagraphIndex < 0) {
            newChapterIndex--;        
            if( newChapterIndex < 0 || calcParagraphLength(chapters, newChapterIndex) === 0 ) {
              setActiveParagraph(null);
              return;
            }
            newParagraphIndex = calcParagraphLength(chapters, newChapterIndex) - 1;
          }
        } else if (direction === 'next') {
          newParagraphIndex++;
    
          const paragraphLength = calcParagraphLength(chapters, newChapterIndex);
          if(newParagraphIndex >= paragraphLength) {
            newChapterIndex++;
            if( newChapterIndex >= chapters.length || calcParagraphLength(chapters, newChapterIndex) === 0 ) {
              setActiveParagraph(null);
              return;
            }
            newParagraphIndex = 0;
          }
        }
    
        const targetChapter = chapters[newChapterIndex];
        const targetParagraph = targetChapter?.paragraphs?.[newParagraphIndex];
    
        if (!targetParagraph) {
          setActiveParagraph(null);
          return;
        }
    
        setActiveParagraph({
          id: targetParagraph.id,
          direction
        });
      }, []);

    const getNavigationAvailability = useCallback((chapterIndex: number, paragraphIndex: number, chaptersLength: number, paragraphs: ParagraphInterface[]) => {
        return {
          canNavigatePrevious: !(chapterIndex === 0 && paragraphIndex === 0),
          canNavigateNext: !(chapterIndex === chaptersLength -1 && paragraphIndex === paragraphs.length -1),
          isTheLastParagraphInChapter: paragraphIndex === paragraphs.length -1,
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
    const onSubtitleTab = useCallback((
        chapters: ChapterInterface[], 
        chapterIndex: number, 
        paragraphs: ParagraphInterface[], 
        setActiveParagraph: (value: { id: string; direction: NavigationDirection } | null) => void
    ): boolean => {
        if (paragraphs.length === 0) {
          return false;
        }
        navigateToAdjacentParagraph(chapters, chapterIndex, -1, 'next', setActiveParagraph);
        return true;
      }, [navigateToAdjacentParagraph]);


    return {
        navigateToAdjacentParagraph,
        getNavigationAvailability,
        onSubtitleTab
    };
}