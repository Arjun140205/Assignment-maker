'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HandwrittenFont } from '@/lib/types/canvas';
import { fontService } from '@/lib/services/fontService';

interface FontSelectorProps {
  selectedFont: HandwrittenFont;
  onFontChange: (font: HandwrittenFont) => void;
}

export default function FontSelector({ selectedFont, onFontChange }: FontSelectorProps) {
  const [fonts, setFonts] = useState<HandwrittenFont[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Filter fonts based on search query
  const filteredFonts = useMemo(() => {
    if (!searchQuery.trim()) {
      return fonts;
    }
    return fontService.searchFonts(searchQuery);
  }, [fonts, searchQuery]);

  // Handle font selection
  const handleFontSelect = async (font: HandwrittenFont) => {
    setLoadingFontId(font.id);
    
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading fonts...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Select Handwriting Font</h3>
        
        {/* Search and View Toggle */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600">
          {filteredFonts.length} {filteredFonts.length === 1 ? 'font' : 'fonts'} available
        </p>
      </div>

      {/* Font List */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {filteredFonts.length === 0 ? (
          <div className="text-center py-8 text-gray-900">
            No fonts found matching &quot;{searchQuery}&quot;
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFonts.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                isSelected={selectedFont.id === font.id}
                isLoading={loadingFontId === font.id}
                onSelect={handleFontSelect}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFonts.map((font) => (
              <FontListItem
                key={font.id}
                font={font}
                isSelected={selectedFont.id === font.id}
                isLoading={loadingFontId === font.id}
                onSelect={handleFontSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Font Card Component for Grid View
interface FontCardProps {
  font: HandwrittenFont;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (font: HandwrittenFont) => void;
}

function FontCard({ font, isSelected, isLoading, onSelect }: FontCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(font)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={`
        relative p-4 rounded-lg border-2 transition-all text-left
        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
    >
      {/* Font Name */}
      <div className="font-medium text-sm mb-2 text-gray-900">{font.name}</div>
      
      {/* Font Preview */}
      <div 
        className="text-lg text-gray-700 overflow-hidden"
        style={{ 
          fontFamily: `"${font.family}", cursive`,
          height: '60px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {fontService.getFontPreview(font).substring(0, 30)}...
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

// Font List Item Component for List View
function FontListItem({ font, isSelected, isLoading, onSelect }: FontCardProps) {
  return (
    <button
      onClick={() => onSelect(font)}
      disabled={isLoading}
      className={`
        w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between
        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 mb-1">{font.name}</div>
        <div 
          className="text-base text-gray-700 truncate"
          style={{ fontFamily: `"${font.family}", cursive` }}
        >
          {fontService.getFontPreview(font)}
        </div>
      </div>

      {isLoading ? (
        <div className="ml-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      ) : isSelected ? (
        <div className="ml-3 bg-blue-600 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      ) : null}
    </button>
  );
}
