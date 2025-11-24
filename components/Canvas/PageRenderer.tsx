'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CanvasPage, PageStyle, HandwrittenFont } from '@/lib/types/canvas';

interface PageRendererProps {
  page: CanvasPage;
  pageStyle: PageStyle;
  font: HandwrittenFont;
  textColor: string;
  onRender?: () => void;
}

/**
 * PageRenderer component - Renders a single canvas page with handwritten text
 * Handles different page styles (ruled, unruled, lined)
 * Memoized to prevent unnecessary re-renders
 */
const PageRenderer: React.FC<PageRendererProps> = React.memo(({
  page,
  pageStyle,
  font,
  textColor,
  onRender,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  // Page dimensions (A4 at 96 DPI)
  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;
  const MARGIN_TOP = 48;
  const MARGIN_BOTTOM = 48;
  const MARGIN_LEFT = 48;
  const MARGIN_RIGHT = 48;
  const LINE_HEIGHT = 32;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render the page
    renderPage(ctx);
    setIsRendered(true);

    if (onRender) {
      onRender();
    }
  }, [page, pageStyle, font, textColor]);

  /**
   * Render the complete page
   */
  const renderPage = (ctx: CanvasRenderingContext2D): void => {
    // Clear canvas
    ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

    // Draw page background based on style
    drawPageBackground(ctx, pageStyle);

    // Draw text lines
    drawTextLines(ctx);
  };

  /**
   * Draw page background based on style
   */
  const drawPageBackground = (
    ctx: CanvasRenderingContext2D,
    style: PageStyle
  ): void => {
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

    switch (style) {
      case 'ruled':
        drawRuledBackground(ctx);
        break;
      case 'lined':
        drawLinedBackground(ctx);
        break;
      case 'unruled':
        // Plain white background, already drawn
        break;
    }
  };

  /**
   * Draw ruled page background (horizontal lines)
   */
  const drawRuledBackground = (ctx: CanvasRenderingContext2D): void => {
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;

    const startY = MARGIN_TOP;
    const endY = PAGE_HEIGHT - MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(MARGIN_LEFT, y);
      ctx.lineTo(PAGE_WIDTH - MARGIN_RIGHT, y);
      ctx.stroke();
    }
  };

  /**
   * Draw lined page background (horizontal lines with margin line)
   */
  const drawLinedBackground = (ctx: CanvasRenderingContext2D): void => {
    // Draw horizontal lines
    ctx.strokeStyle = '#D0E0F0';
    ctx.lineWidth = 1;

    const startY = MARGIN_TOP;
    const endY = PAGE_HEIGHT - MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(MARGIN_LEFT, y);
      ctx.lineTo(PAGE_WIDTH - MARGIN_RIGHT, y);
      ctx.stroke();
    }

    // Draw margin line (red/pink vertical line on left)
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 2;
    const marginLineX = MARGIN_LEFT + 40;

    ctx.beginPath();
    ctx.moveTo(marginLineX, MARGIN_TOP);
    ctx.lineTo(marginLineX, PAGE_HEIGHT - MARGIN_BOTTOM);
    ctx.stroke();
  };

  /**
   * Draw text lines on the page
   */
  const drawTextLines = (ctx: CanvasRenderingContext2D): void => {
    // Set font and color
    ctx.font = `${page.lines[0]?.fontSize || 18}px "${font.family}", cursive`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';

    // Draw each line
    page.lines.forEach((line) => {
      // Add slight character position variations for natural look
      const chars = line.text.split('');
      let currentX = line.x;

      chars.forEach((char) => {
        // Add small random variations
        const xVariation = (Math.random() - 0.5) * 0.3;
        const yVariation = (Math.random() - 0.5) * 0.3;

        ctx.fillText(char, currentX + xVariation, line.y + yVariation);

        // Measure character width for next position
        const charWidth = ctx.measureText(char).width;
        currentX += charWidth;
      });
    });
  };

  return (
    <div className="page-renderer bg-white shadow-lg mx-auto" style={{ width: PAGE_WIDTH }}>
      <canvas
        ref={canvasRef}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        className="block"
      />
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-500">Rendering page {page.pageNumber}...</div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  // Only re-render if these props actually change
  return (
    prevProps.page.pageNumber === nextProps.page.pageNumber &&
    prevProps.page.lines.length === nextProps.page.lines.length &&
    prevProps.pageStyle === nextProps.pageStyle &&
    prevProps.font.id === nextProps.font.id &&
    prevProps.textColor === nextProps.textColor &&
    JSON.stringify(prevProps.page.lines) === JSON.stringify(nextProps.page.lines)
  );
});

PageRenderer.displayName = 'PageRenderer';

export default PageRenderer;
