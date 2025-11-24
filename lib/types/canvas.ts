/**
 * Type definitions for canvas rendering system
 */

/**
 * Page style types for notebook rendering
 */
export type PageStyle = 'ruled' | 'unruled' | 'lined';

/**
 * Handwritten font definition
 */
export interface HandwrittenFont {
  id: string;
  name: string;
  family: string;
  url: string;
  preview: string;
}

/**
 * Canvas page representation
 */
export interface CanvasPage {
  pageNumber: number;
  lines: CanvasLine[];
  style: PageStyle;
}

/**
 * Individual line on canvas
 */
export interface CanvasLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}
