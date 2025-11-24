'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CanvasPage, PageStyle, HandwrittenFont } from '@/lib/types/canvas';
import PageRenderer from './PageRenderer';

interface NotebookCanvasProps {
  pages: CanvasPage[];
  pageStyle: PageStyle;
  font: HandwrittenFont;
  textColor: string;
  onPageRender?: (pageIndex: number) => void;
}

/**
 * NotebookCanvas component - Main container for rendering handwritten pages
 * Manages multiple canvas pages with proper initialization and cleanup
 */
const NotebookCanvas: React.FC<NotebookCanvasProps> = ({
  pages,
  pageStyle,
  font,
  textColor,
  onPageRender,
}) => {
  // Handle page render callback
  const handlePageRender = (pageIndex: number) => {
    if (onPageRender) {
      onPageRender(pageIndex);
    }
  };

  return (
    <div className="notebook-canvas-container w-full h-full overflow-auto bg-gray-100 p-8">
      {pages.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900">Generating handwritten preview...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {pages.map((page, index) => (
            <PageRenderer
              key={`page-${page.pageNumber}-${index}`}
              page={page}
              pageStyle={pageStyle}
              font={font}
              textColor={textColor}
              onRender={() => handlePageRender(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotebookCanvas;
