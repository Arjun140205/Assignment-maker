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

/**
 * Custom error class for rendering failures
 */
export class RenderingError extends Error {
  constructor(
    message: string,
    public pageNumber: number,
    public code: RenderingErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RenderingError';
    Object.setPrototypeOf(this, RenderingError.prototype);
  }
}

/**
 * Error codes for rendering
 */
export enum RenderingErrorCode {
  CANVAS_CONTEXT_LOST = 'CANVAS_CONTEXT_LOST',
  FONT_LOAD_FAILED = 'FONT_LOAD_FAILED',
  INVALID_PAGE_DATA = 'INVALID_PAGE_DATA',
  MEMORY_ERROR = 'MEMORY_ERROR',
  RENDERING_FAILED = 'RENDERING_FAILED',
}

/**
 * Custom error class for export failures
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public stage: ExportStage,
    public code: ExportErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ExportError';
    Object.setPrototypeOf(this, ExportError.prototype);
  }
}

/**
 * Export stages
 */
export type ExportStage = 'preparing' | 'rendering' | 'export' | 'download';

/**
 * Error codes for export
 */
export enum ExportErrorCode {
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  RENDERING_FAILED = 'RENDERING_FAILED',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
}
