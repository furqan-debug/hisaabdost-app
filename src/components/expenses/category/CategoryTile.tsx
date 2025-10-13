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
        "relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        selected && "border-primary ring-2 ring-primary/20 bg-accent"
      )}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: option.color }}
      >
        {Icon ? (
          <Icon size={24} />
        ) : (
          <span className="text-lg font-semibold">
            {option.label.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-xs text-center line-clamp-2 min-h-[2rem]">
        {option.label}
      </span>
      {option.isCustom && (
        <Star size={12} className="absolute top-1 right-1 fill-yellow-400 text-yellow-400" />
      )}
    </button>
  );
}
