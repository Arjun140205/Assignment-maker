'use client';

import React, { useState, useEffect } from 'react';
import { PageStyle } from '@/lib/types/canvas';

interface PageStyleOption {
  value: PageStyle;
  label: string;
  description: string;
}

interface PageStyleSelectorDropdownProps {
  selectedStyle: PageStyle;
  onStyleChange: (style: PageStyle) => void;
}

/**
 * Simple page preview component
 */
function PagePreview({ style, isSelected }: { style: PageStyle; isSelected: boolean }) {
  return (
    <div
      className={`w-10 h-14 bg-white rounded border flex-shrink-0 overflow-hidden transition-all ${isSelected ? 'border-primary shadow-sm' : 'border-gray-200'
        }`}
    >
      <div className="w-full h-full p-1">
        {style === 'ruled' && (
          <div className="w-full h-full flex flex-col justify-evenly">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-blue-200" />
            ))}
          </div>
        )}
        {style === 'lined' && (
          <div className="w-full h-full relative">
            <div className="absolute left-1 top-0 bottom-0 w-px bg-pink-200" />
            <div className="w-full h-full flex flex-col justify-evenly pl-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-px bg-blue-200" />
              ))}
            </div>
          </div>
        )}
        {style === 'unruled' && (
          <div className="w-full h-full" />
        )}
      </div>
    </div>
  );
}

export default function PageStyleSelectorDropdown({
  selectedStyle,
  onStyleChange
}: PageStyleSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const pageStyles: PageStyleOption[] = [
    {
      value: 'ruled',
      label: 'Ruled',
      description: 'Horizontal lines',
    },
    {
      value: 'lined',
      label: 'Margin Lined',
      description: 'Lines with margin',
    },
    {
      value: 'unruled',
      label: 'Plain',
      description: 'No lines',
    },
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
      <label className="label">
        Page Style
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <PagePreview style={selectedStyle} isSelected={true} />
          <div>
            <div className="text-sm font-medium text-gray-800">
              {selectedStyleOption.label}
            </div>
            <div className="text-xs text-gray-500">
              {selectedStyleOption.description}
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
          <div className="p-2">
            {pageStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => handleStyleSelect(style.value)}
                className={`w-full px-3 py-2.5 rounded-md text-left transition-all flex items-center gap-3 ${selectedStyle === style.value
                    ? 'bg-primary-light'
                    : 'hover:bg-gray-50'
                  }`}
              >
                <PagePreview style={style.value} isSelected={selectedStyle === style.value} />

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {style.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {style.description}
                  </div>
                </div>

                {selectedStyle === style.value && (
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
