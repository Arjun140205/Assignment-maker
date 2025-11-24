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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize canvas container
  useEffect(() => {
    if (containerRef.current) {
      setIsInitialized(true);
    }

    return () => {
      // Cleanup on unmount
      setIsInitialized(false);
    };
  }, []);

  // Handle page render callback
  const handlePageRender = (pageIndex: number) => {
    if (onPageRender) {
      onPageRender(pageIndex);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Initializing canvas...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="notebook-canvas-container w-full h-full overflow-auto bg-gray-100 p-8"
    >
      {pages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No content to display</div>
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
