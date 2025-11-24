'use client';

import React, { useState, useEffect } from 'react';
import { PageStyle } from '@/lib/types/canvas';

interface PageStyleSelectorDropdownProps {
  selectedStyle: PageStyle;
  onStyleChange: (style: PageStyle) => void;
}

export default function PageStyleSelectorDropdown({ 
  selectedStyle, 
  onStyleChange 
}: PageStyleSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const pageStyles: Array<{
    value: PageStyle;
    label: string;
    description: string;
  }> = [
    {
      value: 'ruled',
      label: 'Ruled',
      description: 'Horizontal lines'
    },
    {
      value: 'unruled',
      label: 'Unruled',
      description: 'Plain white'
    },
    {
      value: 'lined',
      label: 'Lined',
      description: 'Lines with margin'
    }
  ];

  const selectedStyleOption = pageStyles.find(s => s.value === selectedStyle) || pageStyles[0];

  const handleStyleSelect = (style: PageStyle) => {
    onStyleChange(style);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.style-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="style-dropdown relative">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Page Style
      </label>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-colors"
      >
        <div>
          <div className="text-sm font-medium text-gray-900">
            {selectedStyleOption.label}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {selectedStyleOption.description}
          </div>
        </div>
        
        <svg 
          className={`ml-3 w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
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
          {pageStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => handleStyleSelect(style.value)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedStyle === style.value ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {style.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {style.description}
                  </div>
                </div>
                
                {selectedStyle === style.value && (
                  <svg className="ml-3 w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
