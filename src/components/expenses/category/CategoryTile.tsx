import { CategoryOption } from '@/hooks/useAllCategories';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface CategoryTileProps {
  option: CategoryOption;
  selected: boolean;
  onClick: () => void;
}

export function CategoryTile({ option, selected, onClick }: CategoryTileProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all w-full h-full min-h-[140px]",
        "hover:border-primary/50 hover:bg-accent/50 hover:scale-[1.02]",
        selected && "border-primary ring-2 ring-primary/20 bg-accent"
      )}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-lg"
        style={{ backgroundColor: option.color }}
      >
        {Icon ? (
          <Icon size={28} strokeWidth={2.5} />
        ) : (
          <span className="text-xl font-bold">
            {option.label.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-center line-clamp-2 w-full leading-tight px-1">
        {option.label}
      </span>
      {option.isCustom && (
        <Star size={14} className="absolute top-2.5 right-2.5 fill-yellow-400 text-yellow-400" />
      )}
    </button>
  );
}
