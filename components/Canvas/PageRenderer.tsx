'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasPage, PageStyle, HandwrittenFont, RenderingError, RenderingErrorCode } from '@/lib/types/canvas';

interface PageRendererProps {
  page: CanvasPage;
  pageStyle: PageStyle;
  font: HandwrittenFont;
  textColor: string;
  onRender?: () => void;
  onError?: (error: RenderingError) => void;
}

interface RenderState {
  status: 'idle' | 'loading' | 'rendered' | 'error';
  error?: RenderingError;
}

// Page dimensions (A4 at 96 DPI)
const PAGE_CONFIG = {
  WIDTH: 794,
  HEIGHT: 1123,
  MARGIN_TOP: 60,
  MARGIN_BOTTOM: 60,
  MARGIN_LEFT: 70,
  MARGIN_RIGHT: 50,
  LINE_HEIGHT: 32,
  SAFETY_MARGIN: 5, // Extra pixels to prevent text touching edges
} as const;

/**
 * PageRenderer component - Renders a single canvas page with handwritten text
 * Features:
 * - Error boundary for canvas operations
 * - Context loss handling with recovery
 * - Boundary enforcement to prevent overflow
 * - Visual margin indicators
 */
const PageRenderer: React.FC<PageRendererProps> = React.memo(({
  page,
  pageStyle,
  font,
  textColor,
  onRender,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderState, setRenderState] = useState<RenderState>({ status: 'idle' });
  const [fontLoaded, setFontLoaded] = useState(false);
  const contextLostRef = useRef(false);

  /**
   * Load font before rendering
   */
  const loadFont = useCallback(async () => {
    try {
      // Check if font is already loaded
      if (document.fonts.check(`${page.lines[0]?.fontSize || 18}px "${font.family}"`)) {
        setFontLoaded(true);
        return true;
      }

      // Load font
      const fontFace = new FontFace(font.family, `url(${font.url.replace('https://fonts.googleapis.com/css2?family=', 'https://fonts.gstatic.com/s/').replace(/[+&:;=]/g, '')})`);

      // For Google Fonts, we need to add the link and wait
      const existingLink = document.querySelector(`link[href="${font.url}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        document.head.appendChild(link);
      }

      // Wait for font to load
      await document.fonts.ready;
      setFontLoaded(true);
      return true;
    } catch (error) {
      console.warn(`Failed to load font ${font.name}, using fallback:`, error);
      setFontLoaded(true); // Continue with fallback
      return false;
    }
  }, [font]);

  /**
   * Handle canvas context loss
   */
  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    contextLostRef.current = true;
    setRenderState({
      status: 'error',
      error: new RenderingError(
        'Canvas context lost. Attempting to recover...',
        page.pageNumber,
        RenderingErrorCode.CANVAS_CONTEXT_LOST
      ),
    });
  }, [page.pageNumber]);

  /**
   * Handle canvas context restored
   */
  const handleContextRestored = useCallback(() => {
    contextLostRef.current = false;
    setRenderState({ status: 'idle' });
    // Will trigger re-render through useEffect
  }, []);

  /**
   * Validate line position is within bounds
   */
  const validateLinePosition = useCallback((x: number, y: number, text: string, ctx: CanvasRenderingContext2D): { x: number; y: number; clipped: boolean } => {
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    let adjustedX = x;
    let adjustedY = y;
    let clipped = false;

    // Ensure x is within left margin
    if (adjustedX < PAGE_CONFIG.MARGIN_LEFT + PAGE_CONFIG.SAFETY_MARGIN) {
      adjustedX = PAGE_CONFIG.MARGIN_LEFT + PAGE_CONFIG.SAFETY_MARGIN;
      clipped = true;
    }

    // Ensure text doesn't overflow right margin
    const maxX = PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT - PAGE_CONFIG.SAFETY_MARGIN;
    if (adjustedX + textWidth > maxX) {
      // Text would overflow - will be handled by line wrapping in layout engine
      // For now, just clip at margin
      clipped = true;
    }

    // Ensure y is within top margin
    if (adjustedY < PAGE_CONFIG.MARGIN_TOP + PAGE_CONFIG.SAFETY_MARGIN) {
      adjustedY = PAGE_CONFIG.MARGIN_TOP + PAGE_CONFIG.SAFETY_MARGIN;
      clipped = true;
    }

    // Ensure y doesn't overflow bottom margin
    const maxY = PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM - PAGE_CONFIG.SAFETY_MARGIN;
    if (adjustedY > maxY) {
      adjustedY = maxY;
      clipped = true;
    }

    return { x: adjustedX, y: adjustedY, clipped };
  }, []);

  /**
   * Draw page background based on style
   */
  const drawPageBackground = useCallback((ctx: CanvasRenderingContext2D, style: PageStyle): void => {
    // Fill with white background
    ctx.fillStyle = '#FFFEF7'; // Slightly warm paper color
    ctx.fillRect(0, 0, PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT);

    // Add subtle paper texture (noise)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * PAGE_CONFIG.WIDTH;
      const y = Math.random() * PAGE_CONFIG.HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    switch (style) {
      case 'ruled':
        drawRuledBackground(ctx);
        break;
      case 'lined':
        drawLinedBackground(ctx);
        break;
      case 'unruled':
        // Plain paper background, already drawn
        break;
    }

    // Draw margin boundary indicators (subtle)
    drawMarginIndicators(ctx);
  }, []);

  /**
   * Draw ruled page background (horizontal lines)
   */
  const drawRuledBackground = (ctx: CanvasRenderingContext2D): void => {
    ctx.strokeStyle = '#C8D4E3'; // Soft blue-gray
    ctx.lineWidth = 0.5;

    const startY = PAGE_CONFIG.MARGIN_TOP;
    const endY = PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += PAGE_CONFIG.LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT, y);
      ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, y);
      ctx.stroke();
    }
  };

  /**
   * Draw lined page background (horizontal lines with margin line)
   */
  const drawLinedBackground = (ctx: CanvasRenderingContext2D): void => {
    // Draw horizontal lines
    ctx.strokeStyle = '#B8D4F0'; // Light blue
    ctx.lineWidth = 0.5;

    const startY = PAGE_CONFIG.MARGIN_TOP;
    const endY = PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += PAGE_CONFIG.LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT + 50, y);
      ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, y);
      ctx.stroke();
    }

    // Draw margin line (red/pink vertical line on left)
    ctx.strokeStyle = '#F5B6C1'; // Soft pink
    ctx.lineWidth = 1.5;
    const marginLineX = PAGE_CONFIG.MARGIN_LEFT + 45;

    ctx.beginPath();
    ctx.moveTo(marginLineX, PAGE_CONFIG.MARGIN_TOP - 10);
    ctx.lineTo(marginLineX, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM + 10);
    ctx.stroke();

    // Add punch holes
    const holePositions = [100, PAGE_CONFIG.HEIGHT / 2, PAGE_CONFIG.HEIGHT - 100];
    ctx.fillStyle = '#F0F0F0';
    holePositions.forEach(y => {
      ctx.beginPath();
      ctx.arc(25, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  /**
   * Draw subtle margin indicators
   */
  const drawMarginIndicators = (ctx: CanvasRenderingContext2D): void => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);

    // Only draw corners, not full lines
    const cornerLength = 15;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.MARGIN_TOP);
    ctx.lineTo(PAGE_CONFIG.MARGIN_LEFT + cornerLength, PAGE_CONFIG.MARGIN_TOP);
    ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.MARGIN_TOP);
    ctx.lineTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.MARGIN_TOP + cornerLength);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.MARGIN_TOP);
    ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT - cornerLength, PAGE_CONFIG.MARGIN_TOP);
    ctx.moveTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.MARGIN_TOP);
    ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.MARGIN_TOP + cornerLength);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.lineTo(PAGE_CONFIG.MARGIN_LEFT + cornerLength, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.moveTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.lineTo(PAGE_CONFIG.MARGIN_LEFT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM - cornerLength);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT - cornerLength, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.moveTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM);
    ctx.lineTo(PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT, PAGE_CONFIG.HEIGHT - PAGE_CONFIG.MARGIN_BOTTOM - cornerLength);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
  };

  /**
   * Draw text lines on the page with natural variations
   */
  const drawTextLines = useCallback((ctx: CanvasRenderingContext2D): void => {
    const fontSize = page.lines[0]?.fontSize || 18;
    ctx.font = `${fontSize}px "${font.family}", cursive`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';

    // Seed for consistent random variations per page
    let seed = page.pageNumber * 1000;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Draw each line
    page.lines.forEach((line, lineIndex) => {
      if (!line.text.trim()) return; // Skip empty lines

      // Validate position
      const validated = validateLinePosition(line.x, line.y, line.text, ctx);

      // Add slight baseline variation for natural look
      const baselineOffset = (seededRandom() - 0.5) * 1;

      // Draw character by character for natural variation
      const chars = line.text.split('');
      let currentX = validated.x;

      chars.forEach((char, charIndex) => {
        // Skip rendering if we're past the right margin
        if (currentX > PAGE_CONFIG.WIDTH - PAGE_CONFIG.MARGIN_RIGHT - 5) {
          return;
        }

        // Natural character variations
        const xVariation = (seededRandom() - 0.5) * 0.4;
        const yVariation = (seededRandom() - 0.5) * 0.3 + baselineOffset;
        const rotationVariation = (seededRandom() - 0.5) * 0.02;

        // Save context for rotation
        ctx.save();
        ctx.translate(currentX + xVariation, validated.y + yVariation);
        ctx.rotate(rotationVariation);
        ctx.fillText(char, 0, 0);
        ctx.restore();

        // Move to next character position
        const charWidth = ctx.measureText(char).width;
        currentX += charWidth + (seededRandom() - 0.5) * 0.3; // Slight spacing variation
      });
    });
  }, [page, font, textColor, validateLinePosition]);

  /**
   * Render the complete page
   */
  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || contextLostRef.current) return;

    setRenderState({ status: 'loading' });

    try {
      const ctx = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false
      });

      if (!ctx) {
        throw new RenderingError(
          'Failed to get canvas rendering context',
          page.pageNumber,
          RenderingErrorCode.RENDERING_FAILED
        );
      }

      // Clear canvas
      ctx.clearRect(0, 0, PAGE_CONFIG.WIDTH, PAGE_CONFIG.HEIGHT);

      // Draw background
      drawPageBackground(ctx, page.style);

      // Draw text
      drawTextLines(ctx);

      setRenderState({ status: 'rendered' });
      onRender?.();
    } catch (error) {
      const renderError = error instanceof RenderingError
        ? error
        : new RenderingError(
          error instanceof Error ? error.message : 'Unknown rendering error',
          page.pageNumber,
          RenderingErrorCode.RENDERING_FAILED,
          error instanceof Error ? error : undefined
        );

      setRenderState({ status: 'error', error: renderError });
      onError?.(renderError);
      console.error('Page rendering error:', renderError);
    }
  }, [page, drawPageBackground, drawTextLines, onRender, onError]);

  // Set up context loss listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('contextlost', handleContextLost);
    canvas.addEventListener('contextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('contextlost', handleContextLost);
      canvas.removeEventListener('contextrestored', handleContextRestored);
    };
  }, [handleContextLost, handleContextRestored]);

  // Load font and render
  useEffect(() => {
    loadFont().then(() => {
      if (!contextLostRef.current) {
        renderPage();
      }
    });
  }, [loadFont, renderPage]);

  return (
    <div
      className="page-renderer relative bg-white shadow-lg mx-auto overflow-hidden rounded-sm"
      style={{
        width: PAGE_CONFIG.WIDTH,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <canvas
        ref={canvasRef}
        width={PAGE_CONFIG.WIDTH}
        height={PAGE_CONFIG.HEIGHT}
        className="block"
      />

      {/* Loading overlay */}
      {renderState.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600 font-medium">Rendering page {page.pageNumber}...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {renderState.status === 'error' && renderState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Rendering Error</p>
              <p className="text-xs text-red-600 mt-1 max-w-xs">{renderState.error.message}</p>
            </div>
            <button
              onClick={() => renderPage()}
              className="mt-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Page number indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-gray-100/80 backdrop-blur-sm rounded text-xs text-gray-500 font-medium">
        Page {page.pageNumber}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.page.pageNumber === nextProps.page.pageNumber &&
    prevProps.page.lines.length === nextProps.page.lines.length &&
    prevProps.page.style === nextProps.page.style &&
    prevProps.pageStyle === nextProps.pageStyle &&
    prevProps.font.id === nextProps.font.id &&
    prevProps.textColor === nextProps.textColor &&
    JSON.stringify(prevProps.page.lines) === JSON.stringify(nextProps.page.lines)
  );
});

PageRenderer.displayName = 'PageRenderer';

export default PageRenderer;

// Export page config for use in other components
export { PAGE_CONFIG };
