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

  // Predefined color options (10+ colors as per requirements)
  const predefinedColors: ColorOption[] = [
    { name: 'Black', hex: '#000000', preview: 'The quick brown fox' },
    { name: 'Dark Blue', hex: '#1E3A8A', preview: 'The quick brown fox' },
    { name: 'Blue', hex: '#0000FF', preview: 'The quick brown fox' },
    { name: 'Navy', hex: '#000080', preview: 'The quick brown fox' },
    { name: 'Red', hex: '#DC2626', preview: 'The quick brown fox' },
    { name: 'Dark Red', hex: '#FF0000', preview: 'The quick brown fox' },
    { name: 'Green', hex: '#16A34A', preview: 'The quick brown fox' },
    { name: 'Dark Green', hex: '#008000', preview: 'The quick brown fox' },
    { name: 'Purple', hex: '#9333EA', preview: 'The quick brown fox' },
    { name: 'Dark Purple', hex: '#800080', preview: 'The quick brown fox' },
    { name: 'Brown', hex: '#92400E', preview: 'The quick brown fox' },
    { name: 'Dark Brown', hex: '#8B4513', preview: 'The quick brown fox' },
    { name: 'Gray', hex: '#6B7280', preview: 'The quick brown fox' },
    { name: 'Dark Gray', hex: '#808080', preview: 'The quick brown fox' },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-1">Text Color</h3>
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
            <div className="text-sm font-medium text-gray-700">Current Color</div>
            <div className="text-xs text-gray-500 font-mono">{selectedColor.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Predefined Colors */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Predefined Colors</h4>
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

        {/* Custom Color Picker */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Color</h4>
          
          {!showCustomPicker ? (
            <button
              onClick={() => setShowCustomPicker(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium">Choose Custom Color</span>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCustomColorApply}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowCustomPicker(false);
                    setCustomColor(selectedColor);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
