'use client';

import React, { useState, useEffect } from 'react';
import { PageStyle } from '@/lib/types/canvas';

interface PageStyleOption {
  value: PageStyle;
  label: string;
  description: string;
  icon: string;
}

interface PageStyleSelectorDropdownProps {
  selectedStyle: PageStyle;
  onStyleChange: (style: PageStyle) => void;
}

/**
 * Mini page preview component
 */
function PagePreview({ style, isSelected }: { style: PageStyle; isSelected: boolean }) {
  return (
    <div
      className={`w-12 h-16 bg-white rounded border-2 flex-shrink-0 overflow-hidden transition-all ${isSelected ? 'border-blue-400 shadow-md' : 'border-gray-300'
        }`}
      style={{ boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.2)' : undefined }}
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
            {/* Margin line */}
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-pink-300" />
            {/* Horizontal lines */}
            <div className="w-full h-full flex flex-col justify-evenly pl-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-px bg-blue-200" />
              ))}
            </div>
            {/* Punch holes */}
            <div className="absolute left-0 top-1/4 w-1 h-1 rounded-full bg-gray-200" />
            <div className="absolute left-0 top-1/2 w-1 h-1 rounded-full bg-gray-200" />
            <div className="absolute left-0 top-3/4 w-1 h-1 rounded-full bg-gray-200" />
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
      label: 'Ruled Paper',
      description: 'Classic notebook with horizontal lines',
      icon: '📝',
    },
    {
      value: 'lined',
      label: 'Margin Lined',
      description: 'College-ruled with margin line & holes',
      icon: '📓',
    },
    {
      value: 'unruled',
      label: 'Plain Paper',
      description: 'Clean unlined paper',
      icon: '📄',
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
      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">📄</span>
        Page Style
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all group"
      >
        <div className="flex items-center gap-3">
          <PagePreview style={selectedStyle} isSelected={true} />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {selectedStyleOption.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {selectedStyleOption.description}
            </div>
          </div>
        </div>

        <svg
          className={`ml-3 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all ${isOpen ? 'transform rotate-180' : ''}`}
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
          <div className="p-2">
            {pageStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => handleStyleSelect(style.value)}
                className={`w-full px-3 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${selectedStyle === style.value
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 ring-2 ring-blue-400'
                    : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
              >
                <PagePreview style={style.value} isSelected={selectedStyle === style.value} />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{style.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {style.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 ml-6">
                    {style.description}
                  </div>
                </div>

                {selectedStyle === style.value && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer tip */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 text-center">
              💡 Margin lined is ideal for realistic assignments
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
