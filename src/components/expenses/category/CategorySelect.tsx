import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAllCategories } from '@/hooks/useAllCategories';
import { CategorySelectModal } from './CategorySelectModal';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const { categories } = useAllCategories();

  const selectedCategory = categories.find(c => c.value === value);
  const Icon = selectedCategory?.icon;

  return (
    <div className="space-y-2">
      <Label htmlFor="category-select">Category</Label>
      <button
        id="category-select"
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-input bg-background hover:bg-accent hover:border-accent-foreground/20 transition-colors"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: selectedCategory.color }}
            >
              {Icon ? (
                <Icon size={20} />
              ) : (
                <span className="text-sm font-semibold">
                  {selectedCategory.label.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">{selectedCategory.label}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Select a category</span>
        )}
        <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
      </button>

      <CategorySelectModal
        open={open}
        onOpenChange={setOpen}
        value={value}
        onSelect={onChange}
      />
    </div>
  );
}
