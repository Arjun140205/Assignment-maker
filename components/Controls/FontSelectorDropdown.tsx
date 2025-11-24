'use client';

import React, { useState, useEffect } from 'react';
import { HandwrittenFont } from '@/lib/types/canvas';
import { fontService } from '@/lib/services/fontService';

interface FontSelectorDropdownProps {
  selectedFont: HandwrittenFont;
  onFontChange: (font: HandwrittenFont) => void;
}

export default function FontSelectorDropdown({ 
  selectedFont, 
  onFontChange 
}: FontSelectorDropdownProps) {
  const [fonts, setFonts] = useState<HandwrittenFont[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);

  // Load fonts on mount
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const availableFonts = await fontService.loadFonts();
        setFonts(availableFonts);
      } catch (error) {
        console.error('Failed to load fonts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFonts();
  }, []);

  // Handle font selection
  const handleFontSelect = async (font: HandwrittenFont) => {
    setLoadingFontId(font.id);
    setIsOpen(false);
    
    try {
      // Load the font
      await fontService.loadFont(font);
      
      // Apply the font
      onFontChange(font);
    } catch (error) {
      console.error('Failed to load font:', error);
      alert(`Failed to load font: ${font.name}`);
    } finally {
      setLoadingFontId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.font-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading fonts...</span>
      </div>
    );
  }

  return (
    <div className="font-dropdown relative">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Handwriting Font
      </label>
      
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingFontId !== null}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {selectedFont.name}
          </div>
          <div 
            className="text-xs text-gray-600 truncate mt-1"
            style={{ fontFamily: `"${selectedFont.family}", cursive` }}
          >
            {selectedFont.preview.substring(0, 30)}...
          </div>
        </div>
        
        {loadingFontId ? (
          <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : (
          <svg 
            className={`ml-3 w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {fonts.map((font) => (
            <button
              key={font.id}
              onClick={() => handleFontSelect(font)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedFont.id === font.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {font.name}
                  </div>
                  <div 
                    className="text-xs text-gray-600 truncate mt-1"
                    style={{ fontFamily: `"${font.family}", cursive` }}
                  >
                    {font.preview.substring(0, 40)}...
                  </div>
                </div>
                
                {selectedFont.id === font.id && (
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
