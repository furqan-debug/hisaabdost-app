import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAllCategories } from '@/hooks/useAllCategories';
import { useRecentCategories } from '@/hooks/useRecentCategories';
import { CategoryTile } from './CategoryTile';
import { cn } from '@/lib/utils';

interface CategorySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (value: string) => void;
}

export function CategorySelectModal({
  open,
  onOpenChange,
  value,
  onSelect,
}: CategorySelectModalProps) {
  const navigate = useNavigate();
  const { categories, loading } = useAllCategories();
  const { recent, addRecent } = useRecentCategories();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const lowerQuery = query.toLowerCase();
    return categories.filter(c => c.label.toLowerCase().includes(lowerQuery));
  }, [categories, query]);

  const recentCategories = useMemo(() => {
    return recent
      .map(name => categories.find(c => c.value === name))
      .filter(Boolean);
  }, [recent, categories]);

  const handleSelect = (categoryValue: string) => {
    addRecent(categoryValue);
    onSelect(categoryValue);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {recentCategories.length > 0 && !query && (
          <div className="px-6 py-3 border-b">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentCategories.map((cat) => {
                if (!cat) return null;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleSelect(cat.value)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all",
                      "hover:border-primary/50 hover:bg-accent",
                      value === cat.value && "border-primary bg-accent"
                    )}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {Icon && <Icon size={12} />}
                    </div>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No categories found
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((cat) => (
                <CategoryTile
                  key={cat.value}
                  option={cat}
                  selected={value === cat.value}
                  onClick={() => handleSelect(cat.value)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate('/app/manage-categories');
            }}
          >
            <Settings size={16} className="mr-2" />
            Manage Categories
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
