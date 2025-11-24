/**
 * PDFExporter Service
 * Handles exporting canvas pages to PDF with high resolution
 */

import { jsPDF } from 'jspdf';
import { 
  CanvasPage, 
  PageStyle, 
  HandwrittenFont, 
  ExportError, 
  ExportErrorCode 
} from '@/lib/types/canvas';

export interface ExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // DPI (default: 300)
  fileName?: string;
  compression?: boolean;
  progressive?: boolean; // Enable progressive rendering for large documents
  batchSize?: number; // Number of pages to process in each batch (default: 5)
  memoryLimit?: number; // Memory limit in MB (default: 100)
}

export interface ExportProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  stage: 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';
  message?: string;
}

export class PDFExporter {
  private readonly DEFAULT_DPI = 300;
  private readonly SCREEN_DPI = 96;
  private readonly PAGE_WIDTH = 794; // A4 at 96 DPI
  private readonly PAGE_HEIGHT = 1123;
  private readonly MARGIN_TOP = 48;
  private readonly MARGIN_BOTTOM = 48;
  private readonly MARGIN_LEFT = 48;
  private readonly MARGIN_RIGHT = 48;
  private readonly LINE_HEIGHT = 32;
  private readonly DEFAULT_BATCH_SIZE = 5;
  private readonly DEFAULT_MEMORY_LIMIT = 100; // MB
  private readonly LARGE_DOCUMENT_THRESHOLD = 20; // pages

  private progressCallback?: (progress: ExportProgress) => void;
  private canvasCache: Map<number, HTMLCanvasElement> = new Map();
  private memoryUsage: number = 0;

  /**
   * Set progress callback for export updates
   */
  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Export canvas pages to PDF
   */
  async exportToPDF(
    pages: CanvasPage[],
    font: HandwrittenFont,
    textColor: string,
    pageStyle: PageStyle,
    options: ExportOptions = {}
  ): Promise<Blob> {
    const {
      format = 'a4',
      orientation = 'portrait',
      quality = this.DEFAULT_DPI,
      compression = true,
      progressive = pages.length > this.LARGE_DOCUMENT_THRESHOLD,
      batchSize = this.DEFAULT_BATCH_SIZE,
      memoryLimit = this.DEFAULT_MEMORY_LIMIT,
    } = options;

    try {
      // Clear cache and reset memory tracking
      this.clearCache();

      this.updateProgress({
        currentPage: 0,
        totalPages: pages.length,
        percentage: 0,
        stage: 'preparing',
        message: 'Preparing PDF export...',
      });

      // Use progressive rendering for large documents
      if (progressive) {
        return await this.exportProgressively(
          pages,
          font,
          textColor,
          pageStyle,
          format,
          orientation,
          quality,
          compression,
          batchSize,
          memoryLimit
        );
      }

      // Standard export for smaller documents
      return await this.exportStandard(
        pages,
        font,
        textColor,
        pageStyle,
        format,
        orientation,
        quality,
        compression
      );
    } catch (error) {
      this.updateProgress({
        currentPage: 0,
        totalPages: pages.length,
        percentage: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Export failed',
      });
      throw new ExportError(
        `Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'export',
        ExportErrorCode.PDF_GENERATION_FAILED,
        error instanceof Error ? error : undefined
      );
    } finally {
      // Clean up cache
      this.clearCache();
    }
  }

  /**
   * Standard export for smaller documents
   */
  private async exportStandard(
    pages: CanvasPage[],
    font: HandwrittenFont,
    textColor: string,
    pageStyle: PageStyle,
    format: 'a4' | 'letter',
    orientation: 'portrait' | 'landscape',
    quality: number,
    compression: boolean
  ): Promise<Blob> {
    // Calculate scale factor for high DPI
    const scaleFactor = quality / this.SCREEN_DPI;

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: format === 'a4' ? [this.PAGE_WIDTH, this.PAGE_HEIGHT] : 'letter',
      compress: compression,
    });

    // Load font before rendering
    await this.loadFont(font);

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      this.updateProgress({
        currentPage: i + 1,
        totalPages: pages.length,
        percentage: Math.round(((i + 1) / pages.length) * 90),
        stage: 'rendering',
        message: `Rendering page ${i + 1} of ${pages.length}...`,
      });

      // Create high-resolution canvas for this page
      const canvas = await this.renderPageToCanvas(
        pages[i],
        font,
        textColor,
        pageStyle,
        scaleFactor
      );

      // Convert canvas to image
      const imageData = this.canvasToImage(canvas, quality);

      // Add page to PDF
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imageData,
        'PNG',
        0,
        0,
        this.PAGE_WIDTH,
        this.PAGE_HEIGHT,
        undefined,
        compression ? 'FAST' : 'NONE'
      );

      // Clean up canvas
      canvas.remove();
    }

    this.updateProgress({
      currentPage: pages.length,
      totalPages: pages.length,
      percentage: 95,
      stage: 'generating',
      message: 'Generating PDF file...',
    });

    const pdfBlob = pdf.output('blob');

    this.updateProgress({
      currentPage: pages.length,
      totalPages: pages.length,
      percentage: 100,
      stage: 'complete',
      message: 'PDF export complete!',
    });

    return pdfBlob;
  }

  /**
   * Progressive export for large documents with memory management
   */
  private async exportProgressively(
    pages: CanvasPage[],
    font: HandwrittenFont,
    textColor: string,
    pageStyle: PageStyle,
    format: 'a4' | 'letter',
    orientation: 'portrait' | 'landscape',
    quality: number,
    compression: boolean,
    batchSize: number,
    memoryLimit: number
  ): Promise<Blob> {
    const scaleFactor = quality / this.SCREEN_DPI;
    const memoryLimitBytes = memoryLimit * 1024 * 1024;

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: format === 'a4' ? [this.PAGE_WIDTH, this.PAGE_HEIGHT] : 'letter',
      compress: compression,
    });

    // Load font before rendering
    await this.loadFont(font);

    // Process pages in batches
    const totalBatches = Math.ceil(pages.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, pages.length);
      const batchPages = pages.slice(startIdx, endIdx);

      this.updateProgress({
        currentPage: startIdx + 1,
        totalPages: pages.length,
        percentage: Math.round((startIdx / pages.length) * 90),
        stage: 'rendering',
        message: `Processing batch ${batchIndex + 1} of ${totalBatches} (pages ${startIdx + 1}-${endIdx})...`,
      });

      // Process batch
      for (let i = 0; i < batchPages.length; i++) {
        const pageIndex = startIdx + i;

        // Check memory usage
        if (this.memoryUsage > memoryLimitBytes) {
          // Clear cache to free memory
          this.clearCache();
          
          // Force garbage collection hint (browser may ignore)
          if (global.gc) {
            global.gc();
          }
        }

        // Render page
        const canvas = await this.renderPageToCanvas(
          batchPages[i],
          font,
          textColor,
          pageStyle,
          scaleFactor
        );

        // Track memory usage (approximate)
        this.memoryUsage += canvas.width * canvas.height * 4; // 4 bytes per pixel

        // Convert to image with compression
        const imageData = this.canvasToImage(canvas, quality);

        // Add to PDF
        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imageData,
          'PNG',
          0,
          0,
          this.PAGE_WIDTH,
          this.PAGE_HEIGHT,
          undefined,
          compression ? 'FAST' : 'NONE'
        );

        // Clean up canvas immediately
        canvas.remove();

        // Update progress
        this.updateProgress({
          currentPage: pageIndex + 1,
          totalPages: pages.length,
          percentage: Math.round(((pageIndex + 1) / pages.length) * 90),
          stage: 'rendering',
          message: `Rendering page ${pageIndex + 1} of ${pages.length}...`,
        });
      }

      // Clear cache after each batch
      this.clearCache();

      // Add small delay between batches to allow browser to process
      await this.delay(50);
    }

    this.updateProgress({
      currentPage: pages.length,
      totalPages: pages.length,
      percentage: 95,
      stage: 'generating',
      message: 'Generating PDF file...',
    });

    const pdfBlob = pdf.output('blob');

    this.updateProgress({
      currentPage: pages.length,
      totalPages: pages.length,
      percentage: 100,
      stage: 'complete',
      message: 'PDF export complete!',
    });

    return pdfBlob;
  }

  /**
   * Render a single page to high-resolution canvas
   */
  private async renderPageToCanvas(
    page: CanvasPage,
    font: HandwrittenFont,
    textColor: string,
    pageStyle: PageStyle,
    scaleFactor: number
  ): Promise<HTMLCanvasElement> {
    // Create high-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.PAGE_WIDTH * scaleFactor;
    canvas.height = this.PAGE_HEIGHT * scaleFactor;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ExportError(
        'Failed to get canvas context', 
        'rendering',
        ExportErrorCode.RENDERING_FAILED
      );
    }

    // Scale context for high DPI
    ctx.scale(scaleFactor, scaleFactor);

    // Draw page background
    this.drawPageBackground(ctx, pageStyle);

    // Draw text lines
    await this.drawTextLines(ctx, page, font, textColor);

    return canvas;
  }

  /**
   * Draw page background based on style
   */
  private drawPageBackground(
    ctx: CanvasRenderingContext2D,
    style: PageStyle
  ): void {
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT);

    switch (style) {
      case 'ruled':
        this.drawRuledBackground(ctx);
        break;
      case 'lined':
        this.drawLinedBackground(ctx);
        break;
      case 'unruled':
        // Plain white background, already drawn
        break;
    }
  }

  /**
   * Draw ruled page background (horizontal lines)
   */
  private drawRuledBackground(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;

    const startY = this.MARGIN_TOP;
    const endY = this.PAGE_HEIGHT - this.MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += this.LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(this.MARGIN_LEFT, y);
      ctx.lineTo(this.PAGE_WIDTH - this.MARGIN_RIGHT, y);
      ctx.stroke();
    }
  }

  /**
   * Draw lined page background (horizontal lines with margin line)
   */
  private drawLinedBackground(ctx: CanvasRenderingContext2D): void {
    // Draw horizontal lines
    ctx.strokeStyle = '#D0E0F0';
    ctx.lineWidth = 1;

    const startY = this.MARGIN_TOP;
    const endY = this.PAGE_HEIGHT - this.MARGIN_BOTTOM;

    for (let y = startY; y <= endY; y += this.LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(this.MARGIN_LEFT, y);
      ctx.lineTo(this.PAGE_WIDTH - this.MARGIN_RIGHT, y);
      ctx.stroke();
    }

    // Draw margin line (red/pink vertical line on left)
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 2;
    const marginLineX = this.MARGIN_LEFT + 40;

    ctx.beginPath();
    ctx.moveTo(marginLineX, this.MARGIN_TOP);
    ctx.lineTo(marginLineX, this.PAGE_HEIGHT - this.MARGIN_BOTTOM);
    ctx.stroke();
  }

  /**
   * Draw text lines on the page
   */
  private async drawTextLines(
    ctx: CanvasRenderingContext2D,
    page: CanvasPage,
    font: HandwrittenFont,
    textColor: string
  ): Promise<void> {
    // Set font and color
    const fontSize = page.lines[0]?.fontSize || 18;
    ctx.font = `${fontSize}px "${font.family}", cursive`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';

    // Draw each line
    for (const line of page.lines) {
      // Add slight character position variations for natural look
      const chars = line.text.split('');
      let currentX = line.x;

      for (const char of chars) {
        // Add small random variations
        const xVariation = (Math.random() - 0.5) * 0.3;
        const yVariation = (Math.random() - 0.5) * 0.3;

        ctx.fillText(char, currentX + xVariation, line.y + yVariation);

        // Measure character width for next position
        const charWidth = ctx.measureText(char).width;
        currentX += charWidth;
      }
    }
  }

  /**
   * Load custom font
   */
  private async loadFont(font: HandwrittenFont): Promise<void> {
    try {
      // Check if font is already loaded
      if (document.fonts.check(`18px "${font.family}"`)) {
        return;
      }

      // Load font using FontFace API
      const fontFace = new FontFace(font.family, `url(${font.url})`);
      await fontFace.load();
      document.fonts.add(fontFace);

      // Wait a bit for font to be fully available
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to load font ${font.name}:`, error);
      // Continue with fallback font
    }
  }

  /**
   * Convert canvas to high-resolution image data
   */
  private canvasToImage(canvas: HTMLCanvasElement, quality: number): string {
    // Convert to PNG for best quality
    // Quality parameter is used for JPEG, but we use PNG for better text rendering
    return canvas.toDataURL('image/png');
  }

  /**
   * Download PDF blob as file
   */
  async downloadPDF(blob: Blob, fileName: string = 'handwritten-assignment.pdf'): Promise<void> {
    try {
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new ExportError(
        `Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'download',
        ExportErrorCode.DOWNLOAD_FAILED,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Export and download in one step
   */
  async exportAndDownload(
    pages: CanvasPage[],
    font: HandwrittenFont,
    textColor: string,
    pageStyle: PageStyle,
    options: ExportOptions = {}
  ): Promise<void> {
    const fileName = options.fileName || 'handwritten-assignment.pdf';

    // Export to PDF
    const pdfBlob = await this.exportToPDF(pages, font, textColor, pageStyle, options);

    // Download
    await this.downloadPDF(pdfBlob, fileName);
  }

  /**
   * Estimate PDF file size (rough approximation)
   */
  estimateFileSize(pageCount: number, quality: number = this.DEFAULT_DPI): number {
    // Rough estimate: ~200KB per page at 300 DPI with compression
    const baseSize = 200 * 1024; // 200KB
    const qualityFactor = quality / this.DEFAULT_DPI;
    return Math.round(pageCount * baseSize * qualityFactor);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Clear canvas cache and reset memory tracking
   */
  private clearCache(): void {
    // Remove all cached canvases
    this.canvasCache.forEach((canvas) => {
      canvas.remove();
    });
    this.canvasCache.clear();
    this.memoryUsage = 0;
  }

  /**
   * Delay helper for progressive rendering
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get recommended batch size based on page count and quality
   */
  getRecommendedBatchSize(pageCount: number, quality: number): number {
    // Higher quality = smaller batches to manage memory
    if (quality >= 600) {
      return 3;
    } else if (quality >= 300) {
      return 5;
    } else {
      return 10;
    }
  }

  /**
   * Check if progressive rendering is recommended
   */
  shouldUseProgressive(pageCount: number, quality: number = this.DEFAULT_DPI): boolean {
    // Use progressive for large documents or high quality
    return pageCount > this.LARGE_DOCUMENT_THRESHOLD || quality >= 600;
  }

  /**
   * Get memory estimate for export
   */
  estimateMemoryUsage(pageCount: number, quality: number = this.DEFAULT_DPI): number {
    const scaleFactor = quality / this.SCREEN_DPI;
    const canvasWidth = this.PAGE_WIDTH * scaleFactor;
    const canvasHeight = this.PAGE_HEIGHT * scaleFactor;
    const bytesPerPage = canvasWidth * canvasHeight * 4; // 4 bytes per pixel (RGBA)
    
    // Estimate includes canvas + image data + PDF overhead
    const totalBytes = bytesPerPage * pageCount * 1.5;
    
    return Math.round(totalBytes / (1024 * 1024)); // Return in MB
  }

  /**
   * Validate export options
   */
  validateOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.quality && (options.quality < 72 || options.quality > 600)) {
      errors.push('Quality must be between 72 and 600 DPI');
    }

    if (options.format && !['a4', 'letter'].includes(options.format)) {
      errors.push('Format must be either "a4" or "letter"');
    }

    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push('Orientation must be either "portrait" or "landscape"');
    }

    if (options.batchSize && options.batchSize < 1) {
      errors.push('Batch size must be at least 1');
    }

    if (options.memoryLimit && options.memoryLimit < 10) {
      errors.push('Memory limit must be at least 10 MB');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}



/**
 * Create singleton instance
 */
export const pdfExporter = new PDFExporter();
