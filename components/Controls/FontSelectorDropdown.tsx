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

const CATEGORY_ICONS: Record<FontCategory, string> = {
  natural: '✍️',
  casual: '📝',
  neat: '📖',
  formal: '🖋️',
  artistic: '🎨',
};

const CATEGORY_DESCRIPTIONS: Record<FontCategory, string> = {
  natural: 'Everyday handwriting',
  casual: 'Relaxed student style',
  neat: 'Clear and legible',
  formal: 'Elegant script',
  artistic: 'Unique character',
};

export default function FontSelectorDropdown({
  selectedFont,
  onFontChange
}: FontSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      // Load the font
      await fontService.loadFont(font);

      // Apply the font
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
      <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className="text-lg">✍️</span>
        Handwriting Style
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingFontId !== null}
        className="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-blue-400 hover:shadow-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {selectedFont.name}
            </span>
            {currentFontCategory && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium capitalize">
                {currentFontCategory}
              </span>
            )}
          </div>
          <div
            className="text-sm text-gray-700 truncate mt-1.5 leading-relaxed"
            style={{ fontFamily: `"${selectedFont.family}", cursive` }}
          >
            {selectedFont.preview.substring(0, 35)}...
          </div>
        </div>

        {loadingFontId ? (
          <div className="ml-3 flex-shrink-0">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <svg
            className={`ml-3 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all ${isOpen ? 'transform rotate-180' : ''}`}
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-2 py-2 border-b border-gray-100 bg-gray-50/30">
            <div className="flex flex-wrap gap-1">
              {/* Recommended Tab */}
              <button
                onClick={() => setActiveCategory('recommended')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeCategory === 'recommended'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                ⭐ Recommended
              </button>
              {/* All Tab */}
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                All ({HANDWRITTEN_FONTS.length})
              </button>
              {/* Category Tabs */}
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeCategory === cat.category
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {CATEGORY_ICONS[cat.category]} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <span className="text-2xl">🔍</span>
                <p className="mt-2 text-sm">No fonts match your search</p>
              </div>
            ) : (
              filteredFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => handleFontSelect(font)}
                  disabled={loadingFontId === font.id}
                  className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all border-b border-gray-50 last:border-b-0 disabled:opacity-50 ${selectedFont.id === font.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {font.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                          {font.category}
                        </span>
                      </div>
                      <div
                        className="text-base text-gray-800 truncate mt-1.5"
                        style={{ fontFamily: `"${font.family}", cursive` }}
                      >
                        {font.preview.substring(0, 45)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{font.description}</p>
                    </div>

                    {loadingFontId === font.id ? (
                      <div className="ml-3 flex-shrink-0">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    ) : selectedFont.id === font.id ? (
                      <svg className="ml-3 w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 text-center">
              {activeCategory === 'recommended' ? '⭐ Best fonts for realistic handwriting' :
                activeCategory === 'all' ? `${HANDWRITTEN_FONTS.length} fonts available` :
                  CATEGORY_DESCRIPTIONS[activeCategory as FontCategory]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
