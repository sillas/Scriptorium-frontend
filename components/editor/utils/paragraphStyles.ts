export const paragraphStyles = {
    toggleButtonsStyle: (isEditing: boolean) => `flex flex-col items-center justify-center z-100 select-none transition-opacity duration-200 absolute -left-[2rem] top-0 h-full min-w-[2rem] bg-gray-800 ${isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`,
    toggleButtonStyle: (isEditing: boolean, style: string) => `${isEditing ? 'pointer-events-auto' : 'pointer-events-none'} my-0.5 w-6 h-6 ${style} rounded border shadow-sm focus:outline-none cursor-pointer`,
    paragraphContainerStyle: (isEditing: boolean, isHighlighted: boolean) => `${isEditing ? (isHighlighted ? 'border-4 border-yellow-200 shadow-sm' : 'bg-slate-200 shadow-sm'): (isHighlighted? 'bg-yellow-100 shadow-sm' : '')} rounded-md px-3 mb-1 text-slate-800 relative flex-1`,
    paragraphStyle: (isEditing: boolean, characterCount: number, isQuote: boolean) => `${isEditing ? 'rounded':( characterCount === 0 ? 'bg-red-50' : '')} ${isQuote ? 'pl-[4rem] italic text-gray-600' : 'border-b-2 border-slate-300 border-dotted'} pr-2 pb-4 cursor-text min-h-[1.5rem] outline-none text-justify`,
    characterCountStyle: (isEditing: boolean) => `absolute right-0 bottom-0 text-gray-400 bg-slate-100 rounded px-2 translate-y-1/2 ${isEditing ? 'visible':'invisible group-hover:visible'}`,
    mainContainerStyle: 'relative flex flex-row items-stretch group',
    createNewParagraphAboveStyle: 'relative flex items-center justify-center box-border w-full cursor-pointer border-2 border-transparent hover:border-dashed hover:border-slate-400/30 hover:rounded-t-md hover:text-gray-400 transition-colors duration-200',
    isCursorAtFirstPositionStyle: 'absolute left-0 top-0 text-gray-400 -translate-y-1/2',
    isCursorAtLastPositionStyle: 'absolute left-0 bottom-0 text-gray-400 translate-y-1/2',
    isQuoteStyle: 'absolute pl-[3.5rem] left-0 top-0 text-gray-400 text-5xl select-none pointer-events-none',
    syncIndicatorStyle: 'absolute top-0 right-0',
};