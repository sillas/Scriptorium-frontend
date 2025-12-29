interface AddButtonProps {
  type: 'chapter' | 'paragraph';
  onClick?: () => void;
}

export default function AddButton({ type, onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full cursor-pointer ${
        type === 'chapter' ? 'py-4 mb-4' : 'py-3 mb-2'
      } border-2 border-dashed border-gray-400/30 rounded-lg 
      hover:border-gray-400/60 hover:bg-gray-400/10 
      transition-all duration-200 group`}
    >
      <div className="flex items-center justify-center gap-2 text-gray-400/50 group-hover:text-gray-400/80">
        <span className="text-lg">+</span>
        <span className="text-xs uppercase tracking-wide">
          Add {type}
        </span>
      </div>
    </button>
  );
}
