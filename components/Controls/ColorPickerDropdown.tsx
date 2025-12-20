'use client';

import React, { useState, useEffect } from 'react';

interface ColorOption {
  name: string;
  hex: string;
  category: 'classic' | 'ink' | 'vintage';
  description?: string;
}

interface ColorPickerDropdownProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export default function ColorPickerDropdown({
  selectedColor,
  onColorChange
}: ColorPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'classic' | 'ink' | 'vintage'>('all');

  // Calm, realistic ink colors
  const colors: ColorOption[] = [
    // Classic - everyday writing colors
    { name: 'Black Ink', hex: '#1a1a1a', category: 'classic', description: 'Standard black' },
    { name: 'Dark Blue', hex: '#1e3a5f', category: 'classic', description: 'Classic ballpoint' },
    { name: 'Navy', hex: '#0a1929', category: 'classic', description: 'Deep formal blue' },
    { name: 'Charcoal', hex: '#374151', category: 'classic', description: 'Soft graphite' },

    // Fountain Pen Inks - rich, deep tones
    { name: 'Midnight Blue', hex: '#003366', category: 'ink', description: 'Elegant blue' },
    { name: 'Forest Green', hex: '#1d4d2e', category: 'ink', description: 'Deep green' },
    { name: 'Burgundy', hex: '#722f37', category: 'ink', description: 'Rich wine' },
    { name: 'Walnut', hex: '#5c4033', category: 'ink', description: 'Warm brown' },

    // Vintage - aged, faded tones
    { name: 'Sepia', hex: '#704214', category: 'vintage', description: 'Antique brown' },
    { name: 'Slate', hex: '#6b7280', category: 'vintage', description: 'Muted gray' },
    { name: 'Plum', hex: '#5b3d5b', category: 'vintage', description: 'Soft purple' },
    { name: 'Sage', hex: '#4a5d4a', category: 'vintage', description: 'Earthy green' },
  ];

  const filteredColors = activeCategory === 'all'
    ? colors
    : colors.filter(c => c.category === activeCategory);

  const selectedColorOption = colors.find(c => c.hex === selectedColor) || colors[0];

  const handleColorSelect = (color: ColorOption) => {
    onColorChange(color.hex);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const categoryLabels = {
    all: { label: 'All' },
    classic: { label: 'Classic' },
    ink: { label: 'Fountain' },
    vintage: { label: 'Vintage' },
  };

  return (
    <div className="color-dropdown relative">
      <label className="label flex items-center gap-2">
        <span>Ink Color</span>
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="text-sm font-medium text-gray-800">
              {selectedColorOption.name}
            </div>
            <div className="text-xs text-gray-500">
              {selectedColorOption.description}
            </div>
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-scale-in">
          {/* Category Tabs */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-1">
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeCategory === cat
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {categoryLabels[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Color List */}
          <div className="p-2 max-h-56 overflow-y-auto">
            <div className="space-y-1">
              {filteredColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => handleColorSelect(color)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all ${selectedColor === color.hex
                      ? 'bg-primary-light'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex-shrink-0 border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-800">
                      {color.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {color.description}
                    </div>
                  </div>

                  {selectedColor === color.hex && (
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Preview</span>
              <span
                className="text-sm"
                style={{ color: selectedColor, fontFamily: 'cursive' }}
              >
                The quick brown fox...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
