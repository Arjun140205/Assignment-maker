'use client';

import React, { useState } from 'react';
import { validateColor } from '@/lib/utils/validation';

interface ColorOption {
  name: string;
  hex: string;
  preview: string;
}

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

/**
 * ColorPicker component - Allows users to select text color for handwritten content
 * Provides predefined colors and custom color picker option
 */
export default function ColorPicker({ 
  selectedColor, 
  onColorChange 
}: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  // Simple color options (black, blue, red - like real pens)
  const predefinedColors: ColorOption[] = [
    { name: 'Black', hex: '#000000', preview: 'The quick brown fox' },
    { name: 'Blue', hex: '#0000FF', preview: 'The quick brown fox' },
    { name: 'Red', hex: '#FF0000', preview: 'The quick brown fox' },
  ];

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
  };

  const handleCustomColorApply = () => {
    // Validate color before applying
    const validation = validateColor(customColor);
    if (validation.valid && validation.sanitized) {
      onColorChange(validation.sanitized);
      setShowCustomPicker(false);
    } else {
      alert(validation.error || 'Invalid color format');
    }
  };

  // Check if selected color is a predefined color
  const isPredefinedColor = predefinedColors.some(c => c.hex === selectedColor);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold mb-1 text-gray-900">Text Color</h3>
        <p className="text-sm text-gray-600">
          Choose the color for your handwritten text
        </p>
      </div>

      {/* Color Preview */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Current Color</div>
            <div className="text-xs text-gray-600 font-mono">{selectedColor.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Predefined Colors */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Predefined Colors</h4>
          <div className="grid grid-cols-1 gap-2">
            {predefinedColors.map((color) => (
              <ColorSwatch
                key={color.hex}
                color={color}
                isSelected={selectedColor === color.hex}
                onSelect={handleColorSelect}
              />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}

// Color Swatch Component
interface ColorSwatchProps {
  color: ColorOption;
  isSelected: boolean;
  onSelect: (hex: string) => void;
}

function ColorSwatch({ color, isSelected, onSelect }: ColorSwatchProps) {
  return (
    <button
      onClick={() => onSelect(color.hex)}
      className={`
        relative p-3 rounded-lg border-2 transition-all text-left
        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Color Circle */}
        <div 
          className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
          style={{ backgroundColor: color.hex }}
        />

        {/* Color Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 mb-1">
            {color.name}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {color.hex.toUpperCase()}
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="flex-shrink-0 bg-blue-600 text-white rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Preview Text */}
      <div 
        className="mt-2 text-sm italic"
        style={{ color: color.hex }}
      >
        {color.preview}
      </div>
    </button>
  );
}
