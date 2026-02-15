import { RefObject, useCallback, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { ParagraphInterface, textAlignmentType } from '@/components/editor/types';
import type { ContentMetrics } from '@/hooks/editor/paragraphs/useParagraphContent';
import { useDebounceTimer } from '@/hooks/useDebounceTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { handleDeleteQuestion } from '@/lib/editor/paragraph-helpers';
import { countWords, countCharacters } from '@/lib/editor/text-utils';
import { DiffFormatter, myersDiff } from '@/lib/editor/myersDiff';

interface UseParagraphPersistenceParams {
  paragraphRef: RefObject<HTMLDivElement | null>;
  paragraph: ParagraphInterface;
  shouldRemoteSyncRef: RefObject<boolean>;
  emptyTextPlaceholder: string;
  debounceDelayMs: number;
  isQuote: boolean;
  isHighlighted: boolean;
  textAlignment: textAlignmentType;
  shouldForceLocalSave: boolean;
  shouldForceLocalDelete: boolean;
  updateSyncStatus: (synced: boolean) => void;
  setForceLocalSave: Dispatch<SetStateAction<boolean>>;
  setForceLocalDelete: Dispatch<SetStateAction<boolean>>;
  updateContentMetrics: () => ContentMetrics;
  onDelete?: () => void;
}

interface UseParagraphPersistenceReturn {
  triggerLocalSave: (forceUpdate?: boolean) => boolean;
  scheduleLocalAutoSave: () => void;
}

const paragraphDIff = (original: ParagraphInterface, current: ParagraphInterface) => {

  const diff = myersDiff(original.text.split(' '), current.text.split(' '));
  let diffCsv = DiffFormatter.toCsv(diff);

  // diff text formatting:
  const textStyleDiff = [];
  if(original.isHighlighted !== current.isHighlighted)  {
    // highlighted changed:1 = true, 0 = false 
    textStyleDiff.push(`h:${original.isHighlighted?1:0},${current.isHighlighted?1:0}`);
  }
  if(original.isQuote !== current.isQuote)  {
    // quote changed:1 = true, 0 = false
    textStyleDiff.push(`q:${original.isQuote?1:0},${current.isQuote?1:0}`)
  }
  if(original.textAlignment !== current.textAlignment)  {
    const originalAlignment = original.textAlignment?.substring(5)[0] || 'j';
    const currentAlignment = current.textAlignment?.substring(5)[0] || 'j';
    // alignment changed: 'l' = left, 'c' = center, 'r' = right, 'j' = justify
    textStyleDiff.push(`a:${originalAlignment},${currentAlignment}`);
  }
  
  diffCsv = diffCsv + '\n' + textStyleDiff.join('\n');
  return diffCsv
}

/**
 * Hook to manage paragraph persistence (auto-save, manual save, delete)
 * Handles debouncing, force save/delete flags, and style change saves
 */
export function useParagraphPersistence({
  paragraphRef,
  paragraph,
  shouldRemoteSyncRef,
  emptyTextPlaceholder,
  debounceDelayMs,
  isQuote,
  isHighlighted,
  textAlignment,
  shouldForceLocalSave,
  shouldForceLocalDelete,
  updateSyncStatus,
  setForceLocalSave,
  setForceLocalDelete,
  updateContentMetrics,
  onDelete,
}: UseParagraphPersistenceParams): UseParagraphPersistenceReturn {

  const prevStylesRef = useRef({ isQuote, isHighlighted, textAlignment });
  const { SaveItemOnIndexedDB } = useLocalStorage();
  const [setDebounce, clearDebounceTimer] = useDebounceTimer();
  const previousTextRef = useRef('');

  const getCurrentText = useCallback((): string => {
    // textContent = plain text without line breaks
    // innerText = plain text with line breaks
    // innerHTML = HTML content for saving
    let currentText = (paragraphRef.current?.innerText || '').trim();
    if (currentText === emptyTextPlaceholder) currentText = '';
    else {
      currentText = paragraphRef.current?.innerHTML || '';
    }
    return currentText
  }, []);

  const triggerLocalSave = useCallback( (forceUpdate = false): boolean => {

    const previousText = previousTextRef.current
    const currentText = getCurrentText();

    const textToCompare = currentText.replaceAll('&nbsp;', '').trim();
    if (!forceUpdate && textToCompare === previousText) {
      console.log('triggerLocalSave -> no changes detected, skipping save');
      return false;
    };
    shouldRemoteSyncRef.current = true;
    console.log('triggerLocalSave -> changes detected, saving paragraph');
    
    updateSyncStatus(false);

    previousTextRef.current = textToCompare;

    const old_paragraph = { ...paragraph };

    /// Build updated paragraph data
    paragraph.sync = false;
    paragraph.text = currentText
    paragraph.characterCount = countCharacters(currentText)
    paragraph.wordCount = countWords(currentText)
    paragraph.isQuote = isQuote
    paragraph.isHighlighted = isHighlighted
    paragraph.textAlignment = textAlignment

    const diffCsv = paragraphDIff(old_paragraph, paragraph);
    console.log(diffCsv);
    // Implementar um cemáforo para salvar no IndexedDB no mesmo ID?
    // Continuamos na conodição de corrida.
    // salvar direto em paragraph causa rerender!!!
    SaveItemOnIndexedDB(paragraph, null, 'paragraphs'); // Parágrafo Atualizado
    return true;
  }, [
    paragraph.sync, 
    isQuote,
    isHighlighted, 
    textAlignment, 
    SaveItemOnIndexedDB,
    updateSyncStatus, 
    getCurrentText
  ]);

  const deleteLocalParagraph = useCallback((
    paragraphRef: React.RefObject<HTMLDivElement | null>
  ): boolean => {
    let text = (paragraphRef.current?.textContent || '').trim();
    if (text === emptyTextPlaceholder) text = '';

    const result = handleDeleteQuestion(text, 'parágrafo');
    if (!result) return false;
    onDelete?.();
    return true;
  }, [onDelete]);


  const scheduleLocalAutoSave = useCallback(() => {
    clearDebounceTimer();

    console.log('scheduleLocalAutoSave -> triggerLocalSave');
    setDebounce(triggerLocalSave, debounceDelayMs);
    updateContentMetrics();
  }, [debounceDelayMs, clearDebounceTimer, setDebounce, triggerLocalSave, updateContentMetrics]);

  // Effect to trigger local save when flagged
  useEffect(() => {
    if (!shouldForceLocalSave) return;
    setForceLocalSave(false);
    clearDebounceTimer();

    console.log('shouldForceLocalSave useEffect -> triggerLocalSave');
    triggerLocalSave(true);
  }, [shouldForceLocalSave, clearDebounceTimer, triggerLocalSave, setForceLocalSave]);

  // Effect to trigger local delete when flagged
  useEffect(() => {
    if (!shouldForceLocalDelete) return;
    const deleted = deleteLocalParagraph(paragraphRef);
    if (deleted) setForceLocalDelete(false);
  }, [
    shouldForceLocalDelete,
    deleteLocalParagraph, setForceLocalDelete
  ]);

  // Effect to trigger local save on style changes
  useEffect(() => {
    // TODO: remove this effect and integrate style changes into the main triggerLocalSave flow
    const prev = prevStylesRef.current;
    const hasChanged = prev.isQuote !== isQuote ||
      prev.isHighlighted !== isHighlighted ||
      prev.textAlignment !== textAlignment;
      
    if (!hasChanged) return;
    
    prevStylesRef.current = { isQuote, isHighlighted, textAlignment };
    clearDebounceTimer();

    console.log('hasChanged useEffect -> triggerLocalSave');
    triggerLocalSave(true);
  }, [isQuote, isHighlighted, textAlignment, clearDebounceTimer, triggerLocalSave]);

  useEffect(() => {
    previousTextRef.current = paragraph.text.replaceAll('&nbsp;', '').trim();
  }, [paragraph.text, getCurrentText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearDebounceTimer();
  }, [clearDebounceTimer]);

  return {
    triggerLocalSave,
    scheduleLocalAutoSave,
  };
}
