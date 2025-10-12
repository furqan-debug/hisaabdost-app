import React, { useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { useAllCategories } from "@/hooks/useAllCategories";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryIconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const { categories, loading } = useAllCategories();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false,
  });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, categories.length]);

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
        {/* Embla Carousel viewport */}
        <div className="embla overflow-hidden">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container flex gap-4 px-1 pb-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = value === cat.value;
                return (
                  <div
                    key={`${cat.value}-${cat.isCustom}`}
                    className="embla__slide shrink-0"
                    style={{ flex: '0 0 auto' }}
                  >
                    <button
                      type="button"
                      onClick={() => onChange(cat.value)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300",
                        "active:scale-90 w-[100px] h-[100px]",
                        isSelected ? "bg-primary/5 scale-105 shadow-lg" : "bg-card hover:bg-card/80 hover:scale-102",
                      )}
                      aria-label={`Select ${cat.label}`}
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
                            style={{ color: isSelected ? "#fff" : "#333", strokeWidth: isSelected ? 2.5 : 2 }}
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
                        style={{ color: isSelected ? cat.color : undefined }}
                      >
                        {cat.label}
                      </span>
                      {cat.isCustom && (
                        <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">★</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nav buttons */}
        <button
          type="button"
          onClick={scrollPrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center"
          aria-label="Scroll previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center"
          aria-label="Scroll next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Fade indicators */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background via-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background via-background to-transparent" />
      </div>
    </div>
  );
}
