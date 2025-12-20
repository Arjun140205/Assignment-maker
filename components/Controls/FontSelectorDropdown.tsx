'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HandwrittenFont } from '@/lib/types/canvas';
import { fontService } from '@/lib/services/fontService';
import {
  HANDWRITTEN_FONTS,
  CategorizedFont,
  FontCategory,
  getFontCategories,
  RECOMMENDED_FONTS
} from '@/lib/data/handwritten-fonts';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FontSelectorDropdownProps {
  selectedFont: HandwrittenFont;
  onFontChange: (font: HandwrittenFont) => void;
}

const CATEGORY_LABELS: Record<FontCategory | 'recommended', string> = {
  recommended: '⭐ Recommended',
  natural: 'Natural',
  casual: 'Casual',
  neat: 'Neat',
  formal: 'Formal',
  artistic: 'Artistic',
};

export default function FontSelectorDropdown({
  selectedFont,
  onFontChange
}: FontSelectorDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Group fonts by category
  const fontsByCategory = useMemo(() => {
    const grouped: Record<string, CategorizedFont[]> = {
      recommended: RECOMMENDED_FONTS,
    };

    HANDWRITTEN_FONTS.forEach(font => {
      if (!grouped[font.category]) {
        grouped[font.category] = [];
      }
      grouped[font.category].push(font);
    });

    return grouped;
  }, []);

  // Handle font selection
  const handleFontSelect = async (fontId: string) => {
    const font = HANDWRITTEN_FONTS.find(f => f.id === fontId);
    if (!font) return;

    setIsLoading(true);
    try {
      await fontService.loadFont(font);
      onFontChange(font);
    } catch (error) {
      console.error('Failed to load font:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Preload fonts on mount
  useEffect(() => {
    RECOMMENDED_FONTS.slice(0, 3).forEach(font => {
      fontService.loadFont(font).catch(() => { });
    });
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="font-select" className="text-sm font-medium">
        Handwriting Style
      </Label>

      <Select
        value={selectedFont.id}
        onValueChange={handleFontSelect}
        disabled={isLoading}
      >
        <SelectTrigger id="font-select" className="w-full h-auto py-3">
          <SelectValue>
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-medium text-sm">{selectedFont.name}</span>
              <span
                className="text-xs text-muted-foreground truncate max-w-[200px]"
                style={{ fontFamily: `"${selectedFont.family}", cursive` }}
              >
                {selectedFont.preview.substring(0, 25)}...
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="max-h-80">
          {Object.entries(fontsByCategory).map(([category, fonts]) => (
            <SelectGroup key={category}>
              <SelectLabel className="font-semibold text-xs uppercase tracking-wide">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              </SelectLabel>
              {fonts.map((font) => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  className="py-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{font.name}</span>
                    <span
                      className="text-xs text-muted-foreground"
                      style={{ fontFamily: `"${font.family}", cursive` }}
                    >
                      {font.preview.substring(0, 30)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
