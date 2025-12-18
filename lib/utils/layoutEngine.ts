/**
 * Layout Engine
 * Intelligently positions content on notebook pages with proper spacing and alignment
 */

import { Answer } from '@/lib/types/ai-service';
import { CanvasPage, CanvasLine, PageStyle, HandwrittenFont } from '@/lib/types/canvas';
import { TextMeasurement, MarginConfig, createDefaultMargins } from './textMeasurement';

/**
 * Layout configuration
 */
export interface LayoutConfig {
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  lineHeight: number;
  fontSize: number;
  answerSpacing: number; // Number of blank lines between answers
}

/**
 * Layout result
 */
export interface LayoutResult {
  pages: CanvasPage[];
  totalPages: number;
  totalLines: number;
}

/**
 * Line with metadata
 */
interface LineWithMetadata {
  text: string;
  isAnswerStart: boolean;
  isAnswerEnd: boolean;
  answerNumber: number;
}

/**
 * LayoutEngine class for intelligent content positioning
 * Implements caching for layout calculations
 */
export class LayoutEngine {
  private config: LayoutConfig;
  private textMeasurement: TextMeasurement;
  private layoutCache: Map<string, LayoutResult> = new Map();
  private lineCache: Map<string, string[]> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly SAFETY_MARGIN = 5; // Extra pixels to prevent text touching edges

  constructor(config?: Partial<LayoutConfig>) {
    // Default A4 size at 96 DPI with proper margins
    // These values should match PageRenderer.PAGE_CONFIG
    this.config = {
      pageWidth: config?.pageWidth || 794, // ~8.27 inches at 96 DPI
      pageHeight: config?.pageHeight || 1123, // ~11.69 inches at 96 DPI
      marginTop: config?.marginTop || 60,
      marginBottom: config?.marginBottom || 60,
      marginLeft: config?.marginLeft || 70, // Extra for lined paper margin line
      marginRight: config?.marginRight || 50,
      lineHeight: config?.lineHeight || 32, // ~8-10mm
      fontSize: config?.fontSize || 18,
      answerSpacing: config?.answerSpacing || 1, // One blank line between answers
    };

    this.textMeasurement = new TextMeasurement();
  }

  /**
   * Calculate layout for answers with caching
   */
  calculateLayout(
    answers: Answer[],
    font: HandwrittenFont,
    pageStyle: PageStyle
  ): LayoutResult {
    // Create cache key based on content and settings
    const cacheKey = this.createLayoutCacheKey(answers, font, pageStyle);

    // Check cache first
    if (this.layoutCache.has(cacheKey)) {
      return this.layoutCache.get(cacheKey)!;
    }

    // Convert answers to lines with metadata
    const linesWithMetadata = this.answersToLines(answers, font);

    // Distribute lines across pages
    const pages = this.distributeAcrossPages(linesWithMetadata, pageStyle);

    const result: LayoutResult = {
      pages,
      totalPages: pages.length,
      totalLines: linesWithMetadata.length,
    };

    // Cache the result
    this.cacheLayout(cacheKey, result);

    return result;
  }

  /**
   * Create cache key for layout
   */
  private createLayoutCacheKey(
    answers: Answer[],
    font: HandwrittenFont,
    pageStyle: PageStyle
  ): string {
    const contentHash = answers
      .map(a => `${a.questionNumber}:${a.content.length}`)
      .join('|');
    return `${contentHash}-${font.id}-${pageStyle}-${JSON.stringify(this.config)}`;
  }

  /**
   * Cache layout result with size limit
   */
  private cacheLayout(key: string, result: LayoutResult): void {
    if (this.layoutCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.layoutCache.keys().next().value;
      if (firstKey) {
        this.layoutCache.delete(firstKey);
      }
    }
    this.layoutCache.set(key, result);
  }

  /**
   * Convert answers to lines with word boundary detection
   */
  private answersToLines(answers: Answer[], font: HandwrittenFont): LineWithMetadata[] {
    const allLines: LineWithMetadata[] = [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const lines = this.splitIntoLines(answer.content, font);

      // Mark first and last lines of each answer
      lines.forEach((line, lineIndex) => {
        allLines.push({
          text: line,
          isAnswerStart: lineIndex === 0,
          isAnswerEnd: lineIndex === lines.length - 1,
          answerNumber: answer.questionNumber,
        });
      });

      // Add spacing between answers (except after last answer)
      if (i < answers.length - 1) {
        for (let j = 0; j < this.config.answerSpacing; j++) {
          allLines.push({
            text: '',
            isAnswerStart: false,
            isAnswerEnd: false,
            answerNumber: answer.questionNumber,
          });
        }
      }
    }

    return allLines;
  }

  /**
   * Split text into lines with word boundary detection and caching
   */
  splitIntoLines(text: string, font: HandwrittenFont): string[] {
    // Create cache key
    const cacheKey = `${text.substring(0, 100)}-${font.id}-${this.config.pageWidth}`;

    // Check cache first
    if (this.lineCache.has(cacheKey)) {
      return this.lineCache.get(cacheKey)!;
    }

    const maxWidth =
      this.config.pageWidth - this.config.marginLeft - this.config.marginRight;

    // Split by paragraphs first (preserve intentional line breaks)
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        // Empty paragraph - add blank line
        allLines.push('');
        continue;
      }

      // Split paragraph into words
      const words = paragraph.split(/\s+/).filter(word => word.length > 0);
      const lines = this.wrapWords(words, font, maxWidth);
      allLines.push(...lines);
    }

    // Cache the result
    this.cacheLines(cacheKey, allLines);

    return allLines;
  }

  /**
   * Cache line split result with size limit
   */
  private cacheLines(key: string, lines: string[]): void {
    if (this.lineCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.lineCache.keys().next().value;
      if (firstKey) {
        this.lineCache.delete(firstKey);
      }
    }
    this.lineCache.set(key, lines);
  }

  /**
   * Wrap words into lines that fit within max width
   */
  private wrapWords(words: string[], font: HandwrittenFont, maxWidth: number): string[] {
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      // Check if word alone exceeds max width (handle very long words)
      const wordWidth = this.textMeasurement.measureTextWidth(word, font, this.config.fontSize);

      if (wordWidth > maxWidth) {
        // Word is too long - need to break it
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }

        // Break long word into chunks
        const chunks = this.breakLongWord(word, font, maxWidth);
        lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1];
        continue;
      }

      // Try adding word to current line
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.textMeasurement.measureTextWidth(
        testLine,
        font,
        this.config.fontSize
      );

      if (testWidth <= maxWidth) {
        // Word fits on current line
        currentLine = testLine;
      } else {
        // Word doesn't fit - start new line
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    // Add the last line
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Break a long word into chunks that fit within max width
   */
  private breakLongWord(word: string, font: HandwrittenFont, maxWidth: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    for (const char of word) {
      const testChunk = currentChunk + char;
      const testWidth = this.textMeasurement.measureTextWidth(
        testChunk,
        font,
        this.config.fontSize
      );

      if (testWidth <= maxWidth) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = char;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [word];
  }

  /**
   * Distribute lines across pages with page break logic
   */
  private distributeAcrossPages(
    lines: LineWithMetadata[],
    pageStyle: PageStyle
  ): CanvasPage[] {
    const pages: CanvasPage[] = [];
    const maxLinesPerPage = this.calculateMaxLinesPerPage();

    let currentPageLines: CanvasLine[] = [];
    let pageNumber = 1;
    let currentLineIndex = 0;

    for (const lineData of lines) {
      // Check if we need to start a new page
      if (currentLineIndex >= maxLinesPerPage) {
        // Save current page
        if (currentPageLines.length > 0) {
          pages.push({
            pageNumber,
            lines: currentPageLines,
            style: pageStyle,
          });
        }

        // Start new page
        currentPageLines = [];
        pageNumber++;
        currentLineIndex = 0;
      }

      // Calculate line position
      const y = this.calculateLinePosition(currentLineIndex);

      // Add line to current page
      currentPageLines.push({
        text: lineData.text,
        x: this.config.marginLeft,
        y,
        fontSize: this.config.fontSize,
      });

      currentLineIndex++;
    }

    // Add the last page if it has content
    if (currentPageLines.length > 0) {
      pages.push({
        pageNumber,
        lines: currentPageLines,
        style: pageStyle,
      });
    }

    return pages;
  }

  /**
   * Calculate maximum lines per page
   */
  private calculateMaxLinesPerPage(): number {
    const availableHeight =
      this.config.pageHeight - this.config.marginTop - this.config.marginBottom;
    return Math.floor(availableHeight / this.config.lineHeight);
  }

  /**
   * Calculate line position based on page style
   */
  calculateLinePosition(lineIndex: number): number {
    // For ruled and lined pages, align text with the lines
    // For unruled pages, use regular spacing
    return this.config.marginTop + lineIndex * this.config.lineHeight;
  }

  /**
   * Add one-line spacing between answers
   */
  addQuestionSpacing(pages: CanvasPage[], answers: Answer[]): CanvasPage[] {
    // This is already handled in answersToLines method
    // This method is kept for compatibility but doesn't need to do anything
    return pages;
  }

  /**
   * Get layout configuration
   */
  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  /**
   * Update layout configuration and clear caches
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
    // Clear caches when configuration changes
    this.clearCache();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.layoutCache.clear();
    this.lineCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { layoutCacheSize: number; lineCacheSize: number } {
    return {
      layoutCacheSize: this.layoutCache.size,
      lineCacheSize: this.lineCache.size,
    };
  }

  /**
   * Get margins as MarginConfig
   */
  getMargins(): MarginConfig {
    return {
      top: this.config.marginTop,
      bottom: this.config.marginBottom,
      left: this.config.marginLeft,
      right: this.config.marginRight,
    };
  }

  /**
   * Calculate total pages needed for content
   */
  estimatePageCount(answers: Answer[], font: HandwrittenFont): number {
    const linesWithMetadata = this.answersToLines(answers, font);
    const maxLinesPerPage = this.calculateMaxLinesPerPage();
    return Math.ceil(linesWithMetadata.length / maxLinesPerPage);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearCache();
    this.textMeasurement.destroy();
  }
}

/**
 * Create default layout configuration
 */
export function createDefaultLayoutConfig(): LayoutConfig {
  const margins = createDefaultMargins(96);
  return {
    pageWidth: 794,
    pageHeight: 1123,
    marginTop: margins.top,
    marginBottom: margins.bottom,
    marginLeft: margins.left,
    marginRight: margins.right,
    lineHeight: 32,
    fontSize: 18,
    answerSpacing: 1,
  };
}
