import { useCallback, useEffect, useState } from 'react';
import { 
    Bold, Eraser, Italic, 
    Quote, RemoveFormatting, 
    Star, TextAlignCenter, 
    TextAlignEnd, TextAlignJustify, 
    TextAlignStart, Underline } from 'lucide-react';
import {
    toggleFormattingOnSelection,
    clearFormattingOnSelection
} from '@/components/editor/utils/utils';
import { ParagraphInterface, textAlignmentType } from '@/components/editor/utils/interfaces';

export function useActionButtons(
    paragraph: ParagraphInterface,
    setForceLocalSave: React.Dispatch<React.SetStateAction<boolean>>,
    setForceLocalDelete: React.Dispatch<React.SetStateAction<boolean>>,
) {
    const [isTextFormatting, setIsTextFormatting] = useState(false);
    const [isQuote, setIsQuote] = useState(paragraph.isQuote || false);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isHighlighted, setIsHighlighted] = useState(paragraph.isHighlighted || false);
    const [textAlignment, setTextAlignment] = useState<textAlignmentType>(paragraph.textAlignment || 'text-justify');

    const setTextCenter = useCallback(() => {
        setTextAlignment('text-center');
    }, []);

    const setTextLeft = useCallback(() => {
        setTextAlignment('text-left');
    }, []);

    const setTextRight = useCallback(() => {
        setTextAlignment('text-right');
    }, []);

    const setTextJustify = useCallback(() => {
        setTextAlignment('text-justify');
    }, []);

    const toggleQuote = useCallback(() => {
        setIsQuote(prev => !prev);
    }, []);

    const toggleHighlight = useCallback(() => {
        setIsHighlighted(prev => !prev);
    }, []);

    const handleTextBold = useCallback(() => {
        if (!selection) return;
        toggleFormattingOnSelection(selection, 'strong');
        setIsTextFormatting(true);
        setSelection(null);
    }, [selection]);

    const handleTextUnderline = useCallback(() => {
        if (!selection) return;
        toggleFormattingOnSelection(selection, 'u');
        setIsTextFormatting(true);
        setSelection(null);
    }, [selection]);

    const handleTextItalic = useCallback(() => {
        if (!selection) return;
        toggleFormattingOnSelection(selection, 'i');
        setIsTextFormatting(true);
        setSelection(null);
    }, [selection]);

    const handleClearFormatting = useCallback(() => {
        if (!selection) return;
        clearFormattingOnSelection(selection);
        setIsTextFormatting(true);
        setSelection(null);
    }, [selection]);

    const handleDeleteAction = useCallback(() => {
        setForceLocalDelete(true);
    }, [setForceLocalDelete]);
    
    useEffect(() => {
        if(!isTextFormatting) return;
        setIsTextFormatting(false);
        setForceLocalSave(true);
    }, [isTextFormatting]);

    const vertical_buttons_actions = [
        { Icon: TextAlignCenter, description: 'Toggle Text Center', action: setTextCenter },
        { Icon: TextAlignEnd, description: 'Toggle Text Right', action: setTextRight },
        { Icon: TextAlignStart, description: 'Toggle Text Left', action: setTextLeft },
        { Icon: TextAlignJustify, description: 'Toggle Text Justify', action: setTextJustify },
        { Icon: Quote, description: 'Toggle Quote', action: toggleQuote },
        { Icon: Star, description: 'Toggle Highlight', action: toggleHighlight },
        { Icon: Eraser, description: 'Delete Paragraph', action: handleDeleteAction },
    ];

    const context_buttons_actions = [
        { Icon: Bold, description: 'Set Text Bold', action: handleTextBold},
        { Icon: Italic, description: 'Set Text Italic', action: handleTextItalic},
        { Icon: Underline, description: 'Set Text Underline', action: handleTextUnderline},
        { Icon: RemoveFormatting, description: 'Clear Text Formatting', action: handleClearFormatting},
    ];

    return {
        isQuote,
        isHighlighted,
        textAlignment,
        selection,
        vertical_buttons_actions,
        context_buttons_actions,
        setSelection,
    }
}