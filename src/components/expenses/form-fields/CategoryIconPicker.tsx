import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { useAllCategories } from "@/hooks/useAllCategories";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryIconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const { categories, loading } = useAllCategories();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setCanPrev(scrollLeft > 2);
      setCanNext(scrollLeft + clientWidth < scrollWidth - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [categories]);

  const updateEdges = () => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 2);
  };

  const scrollByCategories = (direction: 'left' | 'right') => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const base = viewport.clientWidth > 0 ? Math.max(240, Math.round(viewport.clientWidth * 0.9)) : (100 + 16) * 3;
    const delta = direction === 'right' ? base : -base;

    viewport.scrollBy({ left: delta, behavior: 'smooth' });
    // Update edges after the smooth scroll settles
    window.setTimeout(updateEdges, 320);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Label>Select Category</Label>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Select Category</Label>
      <div className="relative -mx-4 px-4">
        {/* Native horizontal scroller - touch disabled for button control */}
        <div
          ref={viewportRef}
          className={cn(
            "overflow-x-auto scroll-smooth",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "select-none touch-pan-x"
          )}
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Items row - forced single line */}
          <div className="inline-flex w-max flex-nowrap gap-4 px-1 py-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = value === cat.value;

              return (
                <button
                  key={`${cat.value}-${cat.isCustom}`}
                  type="button"
                  onClick={() => onChange(cat.value)}
                  className={cn(
                    "snap-start relative flex-shrink-0 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300",
                    "active:scale-90 w-[100px] h-[100px]",
                    isSelected ? "bg-primary/5 scale-105 shadow-lg" : "bg-card hover:bg-card/80 hover:scale-102",
                  )}
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                      isSelected ? "shadow-md" : "",
                    )}
                    style={{
                      backgroundColor: isSelected ? cat.color : `${cat.color}50`,
                    }}
                  >
                    {Icon ? (
                      <Icon
                        className="w-7 h-7 transition-all duration-300"
                        style={{
                          color: isSelected ? "#fff" : "#333",
                          strokeWidth: isSelected ? 2.5 : 2,
                        }}
                      />
                    ) : (
                      <div className={cn("w-5 h-5 rounded-full", isSelected ? "bg-white" : "bg-foreground/30")} />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] text-center leading-tight line-clamp-2 w-full px-1 transition-all duration-300",
                      isSelected ? "font-bold" : "font-medium text-foreground/80",
                    )}
                    style={{
                      color: isSelected ? cat.color : undefined,
                    }}
                  >
                    {cat.label}
                  </span>
                  {cat.isCustom && (
                    <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fade edges - wider for better visibility */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background via-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background to-transparent" />

        {/* Arrow controls - always visible and enabled */}
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollByCategories('left')}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-20",
            "rounded-full bg-primary/20 backdrop-blur-sm border-2 border-primary/30",
            "p-3 shadow-lg transition-all duration-200",
            "active:scale-90 hover:bg-primary/30",
            !canPrev && "opacity-40"
          )}
        >
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollByCategories('right')}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-20",
            "rounded-full bg-primary/20 backdrop-blur-sm border-2 border-primary/30",
            "p-3 shadow-lg transition-all duration-200",
            "active:scale-90 hover:bg-primary/30",
            !canNext && "opacity-40"
          )}
        >
          <ChevronRight className="w-6 h-6 text-primary" />
        </button>
      </div>
    </div>
  );
}
