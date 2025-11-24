/**
 * Font Service for managing handwritten font loading and validation
 */

import { HandwrittenFont } from '../types/canvas';
import { HANDWRITTEN_FONTS, DEFAULT_FONT } from '../data/handwritten-fonts';

/**
 * Service class for font management
 */
export class FontService {
  private loadedFonts: Map<string, FontFace> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  /**
   * Get all available handwritten fonts
   */
  async loadFonts(): Promise<HandwrittenFont[]> {
    return HANDWRITTEN_FONTS;
  }

  /**
   * Load a specific font using FontFace API
   * Implements lazy loading - fonts are loaded only when selected
   */
  async loadFont(font: HandwrittenFont): Promise<void> {
    // Check if font is already loaded
    if (this.loadedFonts.has(font.id)) {
      return;
    }

    // Check if font is currently being loaded
    if (this.loadingPromises.has(font.id)) {
      return this.loadingPromises.get(font.id);
    }

    // Validate font before loading
    if (!this.validateFont(font)) {
      throw new Error(`Invalid font: ${font.name}`);
    }

    // Create loading promise
    const loadingPromise = this.loadFontInternal(font);
    this.loadingPromises.set(font.id, loadingPromise);

    try {
      await loadingPromise;
    } finally {
      this.loadingPromises.delete(font.id);
    }
  }

  /**
   * Internal method to load font using FontFace API
   */
  private async loadFontInternal(font: HandwrittenFont): Promise<void> {
    try {
      // For Google Fonts, we need to fetch the CSS and extract the font URL
      if (font.url.includes('fonts.googleapis.com')) {
        await this.loadGoogleFont(font);
      } else {
        // For local fonts, load directly
        await this.loadLocalFont(font);
      }
    } catch (error) {
      console.error(`Failed to load font ${font.name}:`, error);
      throw new Error(`Failed to load font: ${font.name}`);
    }
  }

  /**
   * Load Google Font by injecting link tag
   */
  private async loadGoogleFont(font: HandwrittenFont): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if link already exists
      const existingLink = document.querySelector(`link[href="${font.url}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      // Create link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.url;

      link.onload = () => {
        // Wait a bit for the font to be available
        setTimeout(() => {
          this.loadedFonts.set(font.id, null as any); // Mark as loaded
          resolve();
        }, 100);
      };

      link.onerror = () => {
        reject(new Error(`Failed to load Google Font: ${font.name}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Load local font file using FontFace API
   */
  private async loadLocalFont(font: HandwrittenFont): Promise<void> {
    const fontFace = new FontFace(font.family, `url(${font.url})`);
    
    try {
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      this.loadedFonts.set(font.id, loadedFace);
    } catch (error) {
      throw new Error(`Failed to load local font: ${font.name}`);
    }
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(fontId: string): boolean {
    return this.loadedFonts.has(fontId);
  }

  /**
   * Get font preview text
   */
  getFontPreview(font: HandwrittenFont): string {
    return font.preview || 'The quick brown fox jumps over the lazy dog';
  }

  /**
   * Validate font object
   */
  private validateFont(font: HandwrittenFont): boolean {
    if (!font) return false;
    if (!font.id || typeof font.id !== 'string') return false;
    if (!font.name || typeof font.name !== 'string') return false;
    if (!font.family || typeof font.family !== 'string') return false;
    if (!font.url || typeof font.url !== 'string') return false;
    return true;
  }

  /**
   * Get default font
   */
  getDefaultFont(): HandwrittenFont {
    return DEFAULT_FONT;
  }

  /**
   * Search fonts by name
   */
  searchFonts(query: string): HandwrittenFont[] {
    const lowerQuery = query.toLowerCase();
    return HANDWRITTEN_FONTS.filter(font => 
      font.name.toLowerCase().includes(lowerQuery) ||
      font.family.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Generate font preview canvas
   */
  generateFontPreview(font: HandwrittenFont, text?: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set font
    ctx.fillStyle = '#000000';
    ctx.font = `24px "${font.family}", cursive`;
    ctx.textBaseline = 'middle';

    // Draw text
    const previewText = text || this.getFontPreview(font);
    const maxWidth = canvas.width - 20;
    const x = 10;
    const y = canvas.height / 2;

    // Truncate text if too long
    let displayText = previewText;
    let textWidth = ctx.measureText(displayText).width;
    
    while (textWidth > maxWidth && displayText.length > 0) {
      displayText = displayText.slice(0, -1);
      textWidth = ctx.measureText(displayText + '...').width;
    }
    
    if (displayText.length < previewText.length) {
      displayText += '...';
    }

    ctx.fillText(displayText, x, y);

    return canvas.toDataURL('image/png');
  }

  /**
   * Preload multiple fonts
   */
  async preloadFonts(fonts: HandwrittenFont[]): Promise<void> {
    const promises = fonts.map(font => this.loadFont(font));
    await Promise.all(promises);
  }

  /**
   * Clear all loaded fonts
   */
  clearLoadedFonts(): void {
    this.loadedFonts.clear();
    this.loadingPromises.clear();
  }
}

// Export singleton instance
export const fontService = new FontService();
