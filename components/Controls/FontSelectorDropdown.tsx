'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HandwrittenFont } from '@/lib/types/canvas';
import { fontService } from '@/lib/services/fontService';
import {
  HANDWRITTEN_FONTS,
  CategorizedFont,
  FontCategory,
  getFontCategories,
  RECOMMENDED_FONTS
} from '@/lib/data/handwritten-fonts';

interface FontSelectorDropdownProps {
  selectedFont: HandwrittenFont;
  onFontChange: (font: HandwrittenFont) => void;
}

const CATEGORY_LABELS: Record<FontCategory, string> = {
  natural: 'Natural',
  casual: 'Casual',
  neat: 'Neat',
  formal: 'Formal',
  artistic: 'Artistic',
};

export default function FontSelectorDropdown({
  selectedFont,
  onFontChange
}: FontSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FontCategory | 'all' | 'recommended'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => getFontCategories(), []);

  // Filter fonts based on category and search
  const filteredFonts = useMemo(() => {
    let fonts: CategorizedFont[] = [];

    if (activeCategory === 'recommended') {
      fonts = RECOMMENDED_FONTS;
    } else if (activeCategory === 'all') {
      fonts = HANDWRITTEN_FONTS;
    } else {
      fonts = HANDWRITTEN_FONTS.filter(f => f.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      fonts = fonts.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
      );
    }

    return fonts;
  }, [activeCategory, searchQuery]);

  // Handle font selection
  const handleFontSelect = async (font: CategorizedFont) => {
    setLoadingFontId(font.id);

    try {
      await fontService.loadFont(font);
      onFontChange(font);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to load font:', error);
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

  // Find current font category
  const currentFontCategory = (HANDWRITTEN_FONTS.find(f => f.id === selectedFont.id) as CategorizedFont)?.category;

  return (
    <div className="font-dropdown relative">
      <label className="label">
        Handwriting Style
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingFontId !== null}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {selectedFont.name}
            </span>
            {currentFontCategory && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {currentFontCategory}
              </span>
            )}
          </div>
          <div
            className="text-sm text-gray-600 truncate mt-1"
            style={{ fontFamily: `"${selectedFont.family}", cursive` }}
          >
            {selectedFont.preview.substring(0, 35)}...
          </div>
        </div>

        {loadingFontId ? (
          <div className="spinner ml-3 flex-shrink-0"></div>
        ) : (
          <svg
            className={`ml-3 w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-scale-in">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-2 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCategory('recommended')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeCategory === 'recommended'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeCategory === 'all'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeCategory === cat.category
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {CATEGORY_LABELS[cat.category]}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <p className="text-sm">No fonts match your search</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFonts.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => handleFontSelect(font)}
                    disabled={loadingFontId === font.id}
                    className={`w-full px-3 py-2.5 rounded-md text-left transition-all disabled:opacity-50 ${selectedFont.id === font.id
                        ? 'bg-primary-light'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {font.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">
                            {font.category}
                          </span>
                        </div>
                        <div
                          className="text-sm text-gray-600 truncate mt-1"
                          style={{ fontFamily: `"${font.family}", cursive` }}
                        >
                          {font.preview.substring(0, 40)}
                        </div>
                      </div>

                      {loadingFontId === font.id ? (
                        <div className="spinner ml-3 flex-shrink-0"></div>
                      ) : selectedFont.id === font.id ? (
                        <svg className="ml-3 w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
