'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LUCIDE_ICONS, LUCIDE_ICON_NAMES, LUCIDE_ICON_SEARCH_TR } from '@/lib/chart/lucideIconData';
import type { IconElement } from '@/lib/chart/lucideIconData';

interface LucideIconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (iconName: string) => void;
}

// Pre-build reverse Turkish search index: iconName → set of Turkish keywords
const TR_REVERSE_INDEX: Record<string, string[]> = {};
for (const [trWord, iconNames] of Object.entries(LUCIDE_ICON_SEARCH_TR)) {
  for (const name of iconNames) {
    if (!TR_REVERSE_INDEX[name]) TR_REVERSE_INDEX[name] = [];
    TR_REVERSE_INDEX[name].push(trWord);
  }
}

function renderIconElements(elements: IconElement[], size: number, stroke: string, strokeWidth: number) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {elements.map(([tag, attrs], i) => {
        const props = { ...attrs, key: String(i) };
        switch (tag) {
          case 'path':
            return <path {...props} />;
          case 'circle':
            return <circle {...(props as unknown as React.SVGProps<SVGCircleElement>)} />;
          case 'rect':
            return <rect {...(props as unknown as React.SVGProps<SVGRectElement>)} />;
          case 'line':
            return <line {...(props as unknown as React.SVGProps<SVGLineElement>)} />;
          case 'polyline':
            return <polyline {...(props as unknown as React.SVGProps<SVGPolylineElement>)} />;
          case 'polygon':
            return <polygon {...(props as unknown as React.SVGProps<SVGPolygonElement>)} />;
          case 'ellipse':
            return <ellipse {...(props as unknown as React.SVGProps<SVGEllipseElement>)} />;
          default:
            return <path {...props} />;
        }
      })}
    </svg>
  );
}

const ITEMS_PER_PAGE = 120;

export function LucideIconPicker({ open, onOpenChange, value, onSelect }: LucideIconPickerProps) {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset search and scroll when opening
  useEffect(() => {
    if (open) {
      setSearch('');
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [open]);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return LUCIDE_ICON_NAMES;

    const query = search.trim().toLowerCase();
    const results = new Set<string>();

    // English name search
    for (const name of LUCIDE_ICON_NAMES) {
      if (name.includes(query)) {
        results.add(name);
      }
    }

    // Turkish search
    for (const [trWord, iconNames] of Object.entries(LUCIDE_ICON_SEARCH_TR)) {
      if (trWord.includes(query)) {
        for (const name of iconNames) {
          if (LUCIDE_ICONS[name]) results.add(name);
        }
      }
    }

    return Array.from(results).sort();
  }, [search]);

  // Only show first visibleCount items
  const displayedIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount);
  }, [filteredIcons, visibleCount]);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredIcons.length));
    }
  }, [filteredIcons.length]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [search]);

  const handleSelect = useCallback((name: string) => {
    onSelect(name);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Icon / İkon Seç</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons... / İkon ara..."
          className="h-9 text-sm"
          autoFocus
        />

        {/* Results count */}
        <div className="text-xs text-gray-500">
          {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} found
          {search && ` for "${search}"`}
        </div>

        {/* Icon grid */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ maxHeight: 'calc(80vh - 180px)' }}
        >
          <div className="grid grid-cols-8 gap-1 p-1">
            {displayedIcons.map((name) => {
              const elements = LUCIDE_ICONS[name];
              if (!elements) return null;
              const isSelected = name === value;
              return (
                <button
                  key={name}
                  onClick={() => handleSelect(name)}
                  title={name}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-md border transition-colors
                    hover:bg-blue-50 hover:border-blue-300
                    ${isSelected ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-400' : 'border-gray-200 bg-white'}
                  `}
                  style={{ minHeight: 56 }}
                >
                  {renderIconElements(elements, 20, isSelected ? '#2563eb' : '#374151', 2)}
                  <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center leading-tight">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>

          {visibleCount < filteredIcons.length && (
            <div className="text-center py-3 text-xs text-gray-400">
              Scroll for more...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the render helper for use in other components (e.g., icon preview in settings)
export { renderIconElements };
