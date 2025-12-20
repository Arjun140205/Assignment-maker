'use client';

import React from 'react';
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

interface ColorOption {
  name: string;
  hex: string;
  category: 'classic' | 'ink' | 'vintage';
}

interface ColorPickerDropdownProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

// Calm, realistic ink colors
const COLORS: ColorOption[] = [
  // Classic - everyday writing colors
  { name: 'Black Ink', hex: '#1a1a1a', category: 'classic' },
  { name: 'Dark Blue', hex: '#1e3a5f', category: 'classic' },
  { name: 'Navy', hex: '#0a1929', category: 'classic' },
  { name: 'Charcoal', hex: '#374151', category: 'classic' },
  // Fountain Pen Inks
  { name: 'Midnight Blue', hex: '#003366', category: 'ink' },
  { name: 'Forest Green', hex: '#1d4d2e', category: 'ink' },
  { name: 'Burgundy', hex: '#722f37', category: 'ink' },
  { name: 'Walnut', hex: '#5c4033', category: 'ink' },
  // Vintage
  { name: 'Sepia', hex: '#704214', category: 'vintage' },
  { name: 'Slate', hex: '#6b7280', category: 'vintage' },
  { name: 'Plum', hex: '#5b3d5b', category: 'vintage' },
  { name: 'Sage', hex: '#4a5d4a', category: 'vintage' },
];

const CATEGORY_LABELS = {
  classic: 'Classic',
  ink: 'Fountain Pen',
  vintage: 'Vintage',
};

export default function ColorPickerDropdown({
  selectedColor,
  onColorChange
}: ColorPickerDropdownProps) {
  const selectedColorOption = COLORS.find(c => c.hex === selectedColor) || COLORS[0];

  // Group colors by category
  const colorsByCategory = COLORS.reduce((acc, color) => {
    if (!acc[color.category]) acc[color.category] = [];
    acc[color.category].push(color);
    return acc;
  }, {} as Record<string, ColorOption[]>);

  return (
    <div className="space-y-2">
      <Label htmlFor="color-select" className="text-sm font-medium">
        Ink Color
      </Label>

      <Select
        value={selectedColor}
        onValueChange={onColorChange}
      >
        <SelectTrigger id="color-select" className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: selectedColor }}
              />
              <span>{selectedColorOption.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {Object.entries(colorsByCategory).map(([category, colors]) => (
            <SelectGroup key={category}>
              <SelectLabel className="font-semibold text-xs uppercase tracking-wide">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </SelectLabel>
              {colors.map((color) => (
                <SelectItem key={color.hex} value={color.hex}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
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
