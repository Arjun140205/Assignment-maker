/**
 * HandwritingRenderer Service
 * Handles rendering of text in handwritten style on canvas
 */

import { CanvasPage, CanvasLine, PageStyle, HandwrittenFont } from '@/lib/types/canvas';
import { Answer } from '@/lib/types/ai-service';
import { LayoutEngine, LayoutConfig } from '@/lib/utils/layoutEngine';

interface RenderConfig {
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  lineHeight: number;
  fontSize: number;
}

interface PageCache {
  [key: string]: ImageData;
}

export class HandwritingRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: RenderConfig;
  private pageCache: PageCache = {};
  private layoutEngine: LayoutEngine;

  constructor(config?: Partial<RenderConfig>) {
    // Default A4 size at 96 DPI (standard screen resolution)
    // A4 = 8.27 × 11.69 inches
    this.config = {
      pageWidth: config?.pageWidth || 794, // ~8.27 inches at 96 DPI
      pageHeight: config?.pageHeight || 1123, // ~11.69 inches at 96 DPI
      marginTop: config?.marginTop || 48, // 0.5 inches
      marginBottom: config?.marginBottom || 48,
      marginLeft: config?.marginLeft || 48,
      marginRight: config?.marginRight || 48,
      lineHeight: config?.lineHeight || 32, // ~8-10mm
      fontSize: config?.fontSize || 18,
    };

    // Initialize layout engine with matching configuration
    const layoutConfig: Partial<LayoutConfig> = {
      pageWidth: this.config.pageWidth,
      pageHeight: this.config.pageHeight,
      marginTop: this.config.marginTop,
      marginBottom: this.config.marginBottom,
      marginLeft: this.config.marginLeft,
      marginRight: this.config.marginRight,
      lineHeight: this.config.lineHeight,
      fontSize: this.config.fontSize,
    };
    this.layoutEngine = new LayoutEngine(layoutConfig);
  }

  /**
   * Initialize canvas context
   */
  private initializeCanvas(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.config.pageWidth;
      this.canvas.height = this.config.pageHeight;
    }

    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    this.ctx = ctx;

    // Handle context loss
    this.canvas.addEventListener('contextlost', this.handleContextLoss);
    this.canvas.addEventListener('contextrestored', this.handleContextRestored);
  }

  /**
   * Handle canvas context loss
   */
  private handleContextLoss = (event: Event): void => {
    event.preventDefault();
    console.warn('Canvas context lost');
  };

  /**
   * Handle canvas context restored
   */
  private handleContextRestored = (): void => {
    console.log('Canvas context restored');
    this.pageCache = {}; // Clear cache on context restore
  };

  /**
   * Render answers with handwritten font using layout engine
   */
  async renderAnswers(
    answers: Answer[],
    font: HandwrittenFont,
    color: string,
    pageStyle: PageStyle
  ): Promise<CanvasPage[]> {
    this.initializeCanvas();

    if (!this.ctx) {
      throw new Error('Canvas context not initialized');
    }

    // Load font if not already loaded
    await this.loadFont(font);

    // Use layout engine to calculate layout
    const layoutResult = this.layoutEngine.calculateLayout(answers, font, pageStyle);

    // Clear cache when layout changes
    this.clearCache();

    return layoutResult.pages;
  }

  /**
   * Render text with handwritten font (legacy method)
   */
  async renderText(
    text: string,
    font: HandwrittenFont,
    color: string,
    pageStyle: PageStyle
  ): Promise<CanvasPage[]> {
    this.initializeCanvas();

    if (!this.ctx) {
      throw new Error('Canvas context not initialized');
    }

    // Load font if not already loaded
    await this.loadFont(font);

    // Split text into lines that fit within page width
    const lines = this.wrapText(text, font);

    // Distribute lines across pages
    const pages = this.distributeAcrossPages(lines, pageStyle);

    return pages;
  }

  /**
   * Load custom font
   */
  private async loadFont(font: HandwrittenFont): Promise<void> {
    try {
      // Check if font is already loaded
      if (document.fonts.check(`${this.config.fontSize}px "${font.family}"`)) {
        return;
      }

      // Load font using FontFace API
      const fontFace = new FontFace(font.family, `url(${font.url})`);
      await fontFace.load();
      document.fonts.add(fontFace);
    } catch (error) {
      console.error(`Failed to load font ${font.name}:`, error);
      // Fall back to default font
    }
  }

  /**
   * Measure text width
   */
  private measureText(text: string, font: HandwrittenFont): number {
    if (!this.ctx) {
      throw new Error('Canvas context not initialized');
    }

    this.ctx.font = `${this.config.fontSize}px "${font.family}", cursive`;
    const metrics = this.ctx.measureText(text);
    return metrics.width;
  }

  /**
   * Wrap text into lines that fit within page width
   */
  private wrapText(text: string, font: HandwrittenFont): string[] {
    const maxWidth =
      this.config.pageWidth - this.config.marginLeft - this.config.marginRight;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = this.measureText(testLine, font);

      if (width > maxWidth && currentLine) {
        // Line is too long, push current line and start new one
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    // Push the last line
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Distribute lines across pages
   */
  private distributeAcrossPages(
    lines: string[],
    pageStyle: PageStyle
  ): CanvasPage[] {
    const pages: CanvasPage[] = [];
    const maxLinesPerPage = Math.floor(
      (this.config.pageHeight - this.config.marginTop - this.config.marginBottom) /
        this.config.lineHeight
    );

    let currentPage: CanvasLine[] = [];
    let pageNumber = 1;
    let lineIndex = 0;

    for (const line of lines) {
      if (currentPage.length >= maxLinesPerPage) {
        // Page is full, create new page
        pages.push({
          pageNumber,
          lines: currentPage,
          style: pageStyle,
        });
        currentPage = [];
        pageNumber++;
        lineIndex = 0;
      }

      // Add line to current page with position
      currentPage.push({
        text: line,
        x: this.config.marginLeft,
        y: this.config.marginTop + lineIndex * this.config.lineHeight,
        fontSize: this.config.fontSize,
      });

      lineIndex++;
    }

    // Add the last page if it has content
    if (currentPage.length > 0) {
      pages.push({
        pageNumber,
        lines: currentPage,
        style: pageStyle,
      });
    }

    return pages;
  }

  /**
   * Draw page background based on style
   */
  drawPageBackground(
    ctx: CanvasRenderingContext2D,
    style: PageStyle,
    width: number,
    height: number
  ): void {
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    switch (style) {
      case 'ruled':
        this.drawRuledBackground(ctx, width, height);
        break;
      case 'lined':
        this.drawLinedBackground(ctx, width, height);
        break;
      case 'unruled':
        // Plain white background, already drawn
        break;
    }
  }

  /**
   * Draw ruled page background (horizontal lines)
   */
  private drawRuledBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;

    const startY = this.config.marginTop;
    const endY = height - this.config.marginBottom;

    for (let y = startY; y <= endY; y += this.config.lineHeight) {
      ctx.beginPath();
      ctx.moveTo(this.config.marginLeft, y);
      ctx.lineTo(width - this.config.marginRight, y);
      ctx.stroke();
    }
  }

  /**
   * Draw lined page background (horizontal lines with margin line)
   */
  private drawLinedBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // Draw horizontal lines
    ctx.strokeStyle = '#D0E0F0';
    ctx.lineWidth = 1;

    const startY = this.config.marginTop;
    const endY = height - this.config.marginBottom;

    for (let y = startY; y <= endY; y += this.config.lineHeight) {
      ctx.beginPath();
      ctx.moveTo(this.config.marginLeft, y);
      ctx.lineTo(width - this.config.marginRight, y);
      ctx.stroke();
    }

    // Draw margin line (red/pink vertical line on left)
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 2;
    const marginLineX = this.config.marginLeft + 40;

    ctx.beginPath();
    ctx.moveTo(marginLineX, this.config.marginTop);
    ctx.lineTo(marginLineX, height - this.config.marginBottom);
    ctx.stroke();
  }

  /**
   * Add character position variations for natural look
   */
  addCharacterVariation(x: number, y: number): { x: number; y: number } {
    // Add small random variations to character positions
    const xVariation = (Math.random() - 0.5) * 0.5;
    const yVariation = (Math.random() - 0.5) * 0.5;

    return {
      x: x + xVariation,
      y: y + yVariation,
    };
  }

  /**
   * Get cached page or null if not cached
   */
  getCachedPage(pageKey: string): ImageData | null {
    return this.pageCache[pageKey] || null;
  }

  /**
   * Cache rendered page
   */
  cachePage(pageKey: string, imageData: ImageData): void {
    this.pageCache[pageKey] = imageData;
  }

  /**
   * Clear page cache
   */
  clearCache(): void {
    this.pageCache = {};
  }

  /**
   * Recalculate layout when text is edited
   */
  async recalculateLayout(
    answers: Answer[],
    font: HandwrittenFont,
    pageStyle: PageStyle
  ): Promise<CanvasPage[]> {
    // Clear cache to force re-render
    this.clearCache();

    // Recalculate layout using layout engine
    const layoutResult = this.layoutEngine.calculateLayout(answers, font, pageStyle);

    return layoutResult.pages;
  }

  /**
   * Update renderer configuration and sync with layout engine
   */
  updateConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };

    // Update layout engine configuration
    const layoutConfig: Partial<LayoutConfig> = {
      pageWidth: this.config.pageWidth,
      pageHeight: this.config.pageHeight,
      marginTop: this.config.marginTop,
      marginBottom: this.config.marginBottom,
      marginLeft: this.config.marginLeft,
      marginRight: this.config.marginRight,
      lineHeight: this.config.lineHeight,
      fontSize: this.config.fontSize,
    };
    this.layoutEngine.updateConfig(layoutConfig);

    // Clear cache when configuration changes
    this.clearCache();
  }

  /**
   * Get layout engine instance
   */
  getLayoutEngine(): LayoutEngine {
    return this.layoutEngine;
  }

  /**
   * Estimate page count for answers
   */
  estimatePageCount(answers: Answer[], font: HandwrittenFont): number {
    return this.layoutEngine.estimatePageCount(answers, font);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('contextlost', this.handleContextLoss);
      this.canvas.removeEventListener('contextrestored', this.handleContextRestored);
    }
    this.canvas = null;
    this.ctx = null;
    this.pageCache = {};
    this.layoutEngine.destroy();
  }
}
