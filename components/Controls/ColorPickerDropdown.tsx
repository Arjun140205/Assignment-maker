'use client';

import React, { useState, useEffect } from 'react';

interface ColorOption {
  name: string;
  hex: string;
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

  // Simple color options (black, blue, red - like real pens)
  const colors: ColorOption[] = [
    { name: 'Black', hex: '#000000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Red', hex: '#FF0000' },
  ];

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

  return (
    <div className="color-dropdown relative">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Ink Color
      </label>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {selectedColorOption.name}
            </div>
            <div className="text-xs text-gray-600 font-mono">
              {selectedColor.toUpperCase()}
            </div>
          </div>
        </div>
        
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {colors.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleColorSelect(color)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedColor === color.hex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {color.name}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                      {color.hex.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {selectedColor === color.hex && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
