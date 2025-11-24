/**
 * Text Measurement Utilities
 * Provides canvas-based text measurement and calculations
 */

import { HandwrittenFont } from '@/lib/types/canvas';

/**
 * Text metrics result
 */
export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
}

/**
 * Margin configuration
 */
export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Padding configuration
 */
export interface PaddingConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * TextMeasurement class for canvas-based text measurements
 */
export class TextMeasurement {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initializeCanvas();
  }

  /**
   * Initialize canvas for measurements
   */
  private initializeCanvas(): void {
    if (typeof window === 'undefined') {
      // Server-side rendering - skip canvas initialization
      return;
    }

    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for text measurement');
    }
    this.ctx = ctx;
  }

  /**
   * Measure text width using canvas
   */
  measureTextWidth(text: string, font: HandwrittenFont, fontSize: number): number {
    if (!this.ctx) {
      // Fallback for SSR - rough estimate
      return text.length * fontSize * 0.6;
    }

    this.ctx.font = `${fontSize}px "${font.family}", cursive`;
    const metrics = this.ctx.measureText(text);
    return metrics.width;
  }

  /**
   * Get detailed text metrics
   */
  getTextMetrics(text: string, font: HandwrittenFont, fontSize: number): TextMetrics {
    if (!this.ctx) {
      // Fallback for SSR
      return {
        width: text.length * fontSize * 0.6,
        height: fontSize,
        actualBoundingBoxAscent: fontSize * 0.8,
        actualBoundingBoxDescent: fontSize * 0.2,
      };
    }

    this.ctx.font = `${fontSize}px "${font.family}", cursive`;
    const metrics = this.ctx.measureText(text);

    return {
      width: metrics.width,
      height:
        (metrics.actualBoundingBoxAscent || fontSize * 0.8) +
        (metrics.actualBoundingBoxDescent || fontSize * 0.2),
      actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
      actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || fontSize * 0.2,
    };
  }

  /**
   * Calculate line height based on font and size
   */
  calculateLineHeight(font: HandwrittenFont, fontSize: number, lineSpacing: number = 1.5): number {
    const metrics = this.getTextMetrics('Ag', font, fontSize);
    return metrics.height * lineSpacing;
  }

  /**
   * Calculate available width considering margins
   */
  calculateAvailableWidth(pageWidth: number, margins: MarginConfig): number {
    return pageWidth - margins.left - margins.right;
  }

  /**
   * Calculate available height considering margins
   */
  calculateAvailableHeight(pageHeight: number, margins: MarginConfig): number {
    return pageHeight - margins.top - margins.bottom;
  }

  /**
   * Calculate content area with padding
   */
  calculateContentArea(
    pageWidth: number,
    pageHeight: number,
    margins: MarginConfig,
    padding: PaddingConfig
  ): { width: number; height: number; x: number; y: number } {
    const availableWidth = this.calculateAvailableWidth(pageWidth, margins);
    const availableHeight = this.calculateAvailableHeight(pageHeight, margins);

    return {
      width: availableWidth - padding.left - padding.right,
      height: availableHeight - padding.top - padding.bottom,
      x: margins.left + padding.left,
      y: margins.top + padding.top,
    };
  }

  /**
   * Convert inches to pixels at given DPI
   */
  inchesToPixels(inches: number, dpi: number = 96): number {
    return inches * dpi;
  }

  /**
   * Convert pixels to inches at given DPI
   */
  pixelsToInches(pixels: number, dpi: number = 96): number {
    return pixels / dpi;
  }

  /**
   * Calculate number of lines that fit in available height
   */
  calculateMaxLines(availableHeight: number, lineHeight: number): number {
    return Math.floor(availableHeight / lineHeight);
  }

  /**
   * Estimate word width (rough approximation)
   */
  estimateWordWidth(word: string, font: HandwrittenFont, fontSize: number): number {
    return this.measureTextWidth(word, font, fontSize);
  }

  /**
   * Check if text fits within width
   */
  fitsWithinWidth(text: string, maxWidth: number, font: HandwrittenFont, fontSize: number): boolean {
    const width = this.measureTextWidth(text, font, fontSize);
    return width <= maxWidth;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }
}

/**
 * Create default margin configuration (0.5 inches at 96 DPI)
 */
export function createDefaultMargins(dpi: number = 96): MarginConfig {
  const halfInch = 0.5 * dpi;
  return {
    top: halfInch,
    bottom: halfInch,
    left: halfInch,
    right: halfInch,
  };
}

/**
 * Create default padding configuration
 */
export function createDefaultPadding(): PaddingConfig {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

/**
 * Singleton instance for text measurement
 */
let textMeasurementInstance: TextMeasurement | null = null;

/**
 * Get or create text measurement instance
 */
export function getTextMeasurement(): TextMeasurement {
  if (!textMeasurementInstance) {
    textMeasurementInstance = new TextMeasurement();
  }
  return textMeasurementInstance;
}
