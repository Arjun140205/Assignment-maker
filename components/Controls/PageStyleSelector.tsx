'use client';

import React, { useState } from 'react';
import { PageStyle } from '@/lib/types/canvas';

interface PageStyleSelectorProps {
  selectedStyle: PageStyle;
  onStyleChange: (style: PageStyle) => void;
}

/**
 * PageStyleSelector component - Allows users to select notebook page style
 * Provides three options: ruled, unruled, and lined with visual previews
 */
export default function PageStyleSelector({ 
  selectedStyle, 
  onStyleChange 
}: PageStyleSelectorProps) {
  const [hoveredStyle, setHoveredStyle] = useState<PageStyle | null>(null);

  const pageStyles: Array<{
    value: PageStyle;
    label: string;
    description: string;
  }> = [
    {
      value: 'ruled',
      label: 'Ruled',
      description: 'Horizontal lines for neat writing'
    },
    {
      value: 'unruled',
      label: 'Unruled',
      description: 'Plain white pages without lines'
    },
    {
      value: 'lined',
      label: 'Lined',
      description: 'Lines with left margin (notebook style)'
    }
  ];

  const handleStyleSelect = (style: PageStyle) => {
    onStyleChange(style);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-1">Page Style</h3>
        <p className="text-sm text-gray-600">
          Choose the notebook page style for your assignment
        </p>
      </div>

      {/* Style Options */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-4">
          {pageStyles.map((style) => (
            <StyleOption
              key={style.value}
              style={style}
              isSelected={selectedStyle === style.value}
              isHovered={hoveredStyle === style.value}
              onSelect={handleStyleSelect}
              onHover={setHoveredStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Style Option Component
interface StyleOptionProps {
  style: {
    value: PageStyle;
    label: string;
    description: string;
  };
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (style: PageStyle) => void;
  onHover: (style: PageStyle | null) => void;
}

function StyleOption({ 
  style, 
  isSelected, 
  isHovered, 
  onSelect, 
  onHover 
}: StyleOptionProps) {
  return (
    <button
      onClick={() => onSelect(style.value)}
      onMouseEnter={() => onHover(style.value)}
      onMouseLeave={() => onHover(null)}
      className={`
        relative p-4 rounded-lg border-2 transition-all text-left
        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          <StylePreview style={style.value} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-base text-gray-900 mb-1">
            {style.label}
          </div>
          <div className="text-sm text-gray-600">
            {style.description}
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="flex-shrink-0 bg-blue-600 text-white rounded-full p-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

// Style Preview Component
interface StylePreviewProps {
  style: PageStyle;
}

function StylePreview({ style }: StylePreviewProps) {
  const previewWidth = 80;
  const previewHeight = 100;

  return (
    <svg
      width={previewWidth}
      height={previewHeight}
      viewBox={`0 0 ${previewWidth} ${previewHeight}`}
      className="border border-gray-300 rounded bg-white"
    >
      {/* Background */}
      <rect width={previewWidth} height={previewHeight} fill="white" />

      {/* Render based on style */}
      {style === 'ruled' && <RuledPreview width={previewWidth} height={previewHeight} />}
      {style === 'unruled' && <UnruledPreview width={previewWidth} height={previewHeight} />}
      {style === 'lined' && <LinedPreview width={previewWidth} height={previewHeight} />}
    </svg>
  );
}

// Ruled style preview (horizontal lines)
function RuledPreview({ width, height }: { width: number; height: number }) {
  const lineSpacing = 12;
  const marginLeft = 8;
  const marginRight = 8;
  const lines = [];

  for (let y = 15; y < height - 10; y += lineSpacing) {
    lines.push(
      <line
        key={y}
        x1={marginLeft}
        y1={y}
        x2={width - marginRight}
        y2={y}
        stroke="#E0E0E0"
        strokeWidth="1"
      />
    );
  }

  return <>{lines}</>;
}

// Unruled style preview (plain)
function UnruledPreview({ width, height }: { width: number; height: number }) {
  // Just a plain white background, already rendered
  return null;
}

// Lined style preview (horizontal lines with margin line)
function LinedPreview({ width, height }: { width: number; height: number }) {
  const lineSpacing = 12;
  const marginLeft = 8;
  const marginRight = 8;
  const marginLineX = 18;
  const lines = [];

  // Horizontal lines
  for (let y = 15; y < height - 10; y += lineSpacing) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={marginLeft}
        y1={y}
        x2={width - marginRight}
        y2={y}
        stroke="#D0E0F0"
        strokeWidth="1"
      />
    );
  }

  // Vertical margin line (red/pink)
  lines.push(
    <line
      key="margin"
      x1={marginLineX}
      y1={10}
      x2={marginLineX}
      y2={height - 10}
      stroke="#FFB6C1"
      strokeWidth="2"
    />
  );

  return <>{lines}</>;
}
