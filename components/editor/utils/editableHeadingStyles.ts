export const EditableHeadingStyles = {
    baseStyles: 'cursor-text flex-1 outline-none focus:bg-slate-200 focus:shadow-sm focus:rounded focus:px-1',
    sizeStyles: (isTitle: boolean, isDocumentLevel: boolean) => isTitle
        ? isDocumentLevel ? 'text-3xl font-bold text-slate-900' : 'text-xl font-semibold text-slate-800'
        : isDocumentLevel ? 'text-lg mt-2 text-slate-600' : 'text-sm mt-1 text-slate-600',
};