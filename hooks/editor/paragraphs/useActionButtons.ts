import { useCallback, useMemo, useState } from 'react';
import { 
    Bold, Eraser, Italic, 
    Quote, RemoveFormatting, 
    Star, TextAlignCenter, 
    TextAlignEnd, TextAlignJustify, 
    TextAlignStart, Underline } from 'lucide-react';
import {
    toggleFormattingOnSelection,
    clearFormattingOnSelection
} from '@/lib/editor/formatting';
import { ParagraphInterface, textAlignmentType, FormatTag } from '@/components/editor/types';

export function useActionButtons(
    paragraph: ParagraphInterface,
    setForceLocalSave: React.Dispatch<React.SetStateAction<boolean>>,
    setForceLocalDelete: React.Dispatch<React.SetStateAction<boolean>>,
) {
    const [isQuote, setIsQuote] = useState(paragraph?.isQuote || false);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isHighlighted, setIsHighlighted] = useState(paragraph?.isHighlighted || false);
    const [textAlignment, setTextAlignment] = useState<textAlignmentType>(paragraph?.textAlignment || 'text-justify');

    const verticalButtonsActions = useMemo(() => [
        { Icon: TextAlignStart, description: 'Toggle Text Left', action: () => setTextAlignment('text-left') },
        { Icon: TextAlignCenter, description: 'Toggle Text Center', action: () => setTextAlignment('text-center') },
        { Icon: TextAlignEnd, description: 'Toggle Text Right', action: () => setTextAlignment('text-right') },
        { Icon: TextAlignJustify, description: 'Toggle Text Justify', action: () => setTextAlignment('text-justify') },
        { Icon: Quote, description: 'Toggle Quote', action: () => setIsQuote(prev => !prev) },
        { Icon: Star, description: 'Toggle Highlight', action: () => setIsHighlighted(prev => !prev) },
        { Icon: Eraser, description: 'Delete Paragraph', action: () => setForceLocalDelete(true) },
    ], [setTextAlignment, setIsQuote, setIsHighlighted, setForceLocalDelete]);

    const handleFormatting = useCallback((tag: FormatTag | null) => {
        if (!selection) return;
        if (tag) toggleFormattingOnSelection(selection, tag);
        else clearFormattingOnSelection(selection);
        setForceLocalSave(true);
        setSelection(null);
    }, [selection, setForceLocalSave]);

    const contextButtonsActions = useMemo(() => [
        { Icon: Bold, description: 'Toggle Bold', action: () => handleFormatting('strong')},
        { Icon: Italic, description: 'Toggle Italic', action: () => handleFormatting('i')},
        { Icon: Underline, description: 'Toggle Underline', action: () => handleFormatting('u')},
        { Icon: RemoveFormatting, description: 'Clear Text Formatting', action: () => handleFormatting(null)},
    ], [handleFormatting]);
    return {
        isQuote,
        isHighlighted,
        textAlignment,
        verticalButtonsActions,
        contextButtonsActions,
        selection,
        setSelection,
    }
}