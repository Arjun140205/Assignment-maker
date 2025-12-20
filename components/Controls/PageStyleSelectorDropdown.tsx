'use client';

import React from 'react';
import { PageStyle } from '@/lib/types/canvas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PageStyleSelectorDropdownProps {
  selectedStyle: PageStyle;
  onStyleChange: (style: PageStyle) => void;
}

const PAGE_STYLES: { value: PageStyle; label: string; description: string }[] = [
  { value: 'ruled', label: 'Ruled', description: 'Horizontal lines' },
  { value: 'lined', label: 'Margin Lined', description: 'Lines with margin' },
  { value: 'unruled', label: 'Plain', description: 'No lines' },
];

/**
 * Mini page preview component
 */
function PagePreview({ style }: { style: PageStyle }) {
  return (
    <div className="w-6 h-8 bg-white rounded border border-border flex-shrink-0 overflow-hidden">
      <div className="w-full h-full p-0.5">
        {style === 'ruled' && (
          <div className="w-full h-full flex flex-col justify-evenly">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full h-px bg-blue-200" />
            ))}
          </div>
        )}
        {style === 'lined' && (
          <div className="w-full h-full relative">
            <div className="absolute left-0.5 top-0 bottom-0 w-px bg-pink-300" />
            <div className="w-full h-full flex flex-col justify-evenly pl-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full h-px bg-blue-200" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageStyleSelectorDropdown({
  selectedStyle,
  onStyleChange
}: PageStyleSelectorDropdownProps) {
  const selectedOption = PAGE_STYLES.find(s => s.value === selectedStyle) || PAGE_STYLES[0];

  return (
    <div className="space-y-2">
      <Label htmlFor="style-select" className="text-sm font-medium">
        Page Style
      </Label>

      <Select
        value={selectedStyle}
        onValueChange={(value) => onStyleChange(value as PageStyle)}
      >
        <SelectTrigger id="style-select" className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <PagePreview style={selectedStyle} />
              <span>{selectedOption.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {PAGE_STYLES.map((style) => (
            <SelectItem key={style.value} value={style.value}>
              <div className="flex items-center gap-2">
                <PagePreview style={style.value} />
                <div className="flex flex-col">
                  <span className="font-medium">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
