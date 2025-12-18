'use client';

import React, { useState, useEffect } from 'react';

interface ColorOption {
  name: string;
  hex: string;
  category: 'classic' | 'ink' | 'creative';
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
  const [activeCategory, setActiveCategory] = useState<'all' | 'classic' | 'ink' | 'creative'>('all');

  // Realistic ink colors organized by category
  const colors: ColorOption[] = [
    // Classic Pen Colors
    { name: 'Black', hex: '#1a1a1a', category: 'classic', description: 'Standard black ink' },
    { name: 'Dark Blue', hex: '#1e3a5f', category: 'classic', description: 'Classic ballpoint blue' },
    { name: 'Royal Blue', hex: '#0047ab', category: 'classic', description: 'Traditional fountain pen blue' },
    { name: 'Red', hex: '#c41e3a', category: 'classic', description: 'Teacher marking red' },

    // Fountain Pen Inks
    { name: 'Midnight Blue', hex: '#003366', category: 'ink', description: 'Deep formal blue' },
    { name: 'Navy', hex: '#0a1929', category: 'ink', description: 'Dark navy ink' },
    { name: 'Burgundy', hex: '#722f37', category: 'ink', description: 'Rich wine red' },
    { name: 'Forest Green', hex: '#1d4d2e', category: 'ink', description: 'Deep forest green' },
    { name: 'Walnut Brown', hex: '#5c4033', category: 'ink', description: 'Vintage brown ink' },
    { name: 'Sepia', hex: '#704214', category: 'ink', description: 'Classic sepia tone' },

    // Creative Colors
    { name: 'Violet', hex: '#5b21b6', category: 'creative', description: 'Rich purple ink' },
    { name: 'Teal', hex: '#0d9488', category: 'creative', description: 'Ocean teal' },
    { name: 'Coral', hex: '#dc2626', category: 'creative', description: 'Warm coral red' },
    { name: 'Graphite', hex: '#374151', category: 'creative', description: 'Pencil-like gray' },
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
    all: { icon: '🎨', label: 'All Colors' },
    classic: { icon: '✒️', label: 'Classic' },
    ink: { icon: '🖋️', label: 'Fountain' },
    creative: { icon: '✨', label: 'Creative' },
  };

  return (
    <div className="color-dropdown relative">
      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">🖊️</span>
        Ink Color
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shadow-md flex-shrink-0 ring-2 ring-white"
            style={{
              backgroundColor: selectedColor,
              boxShadow: `0 4px 12px ${selectedColor}40`
            }}
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {selectedColorOption.name}
            </div>
            <div className="text-xs text-gray-500">
              {selectedColorOption.description || 'Selected ink color'}
            </div>
          </div>
        </div>

        <svg
          className={`w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Category Tabs */}
          <div className="px-2 py-2 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeCategory === cat
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {categoryLabels[cat].icon} {categoryLabels[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {filteredColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => handleColorSelect(color)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 ${selectedColor === color.hex ? 'bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-400' : ''
                    }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg shadow-md flex-shrink-0 ring-2 ring-white"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: `0 2px 8px ${color.hex}30`
                    }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {color.name}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {color.hex.toUpperCase()}
                    </div>
                  </div>

                  {selectedColor === color.hex && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preview */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Preview:</span>
              <span
                className="text-sm font-medium"
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
