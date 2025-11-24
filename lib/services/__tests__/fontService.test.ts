import { describe, it, expect, beforeEach } from 'vitest';
import { FontService } from '../fontService';
import { HandwrittenFont } from '@/lib/types/canvas';

describe('FontService', () => {
  let fontService: FontService;

  beforeEach(() => {
    fontService = new FontService();
  });

  describe('loadFonts', () => {
    it('should load available fonts', async () => {
      const fonts = await fontService.loadFonts();
      
      expect(fonts).toBeDefined();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
    });

    it('should return fonts with required properties', async () => {
      const fonts = await fontService.loadFonts();
      const font = fonts[0];
      
      expect(font.id).toBeDefined();
      expect(font.name).toBeDefined();
      expect(font.family).toBeDefined();
      expect(font.url).toBeDefined();
    });
  });

  describe('getDefaultFont', () => {
    it('should return default font', () => {
      const defaultFont = fontService.getDefaultFont();
      
      expect(defaultFont).toBeDefined();
      expect(defaultFont.id).toBeDefined();
      expect(defaultFont.name).toBeDefined();
    });
  });

  describe('searchFonts', () => {
    it('should search fonts by name', () => {
      const results = fontService.searchFonts('hand');
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = fontService.searchFonts('nonexistentfontname12345');
      
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const results1 = fontService.searchFonts('HAND');
      const results2 = fontService.searchFonts('hand');
      
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('getFontPreview', () => {
    it('should return preview text', () => {
      const mockFont: HandwrittenFont = {
        id: 'test',
        name: 'Test',
        family: 'Test',
        url: 'test.woff2',
        preview: 'Custom preview',
      };
      
      const preview = fontService.getFontPreview(mockFont);
      expect(preview).toBe('Custom preview');
    });

    it('should return default preview if not specified', () => {
      const mockFont: HandwrittenFont = {
        id: 'test',
        name: 'Test',
        family: 'Test',
        url: 'test.woff2',
      };
      
      const preview = fontService.getFontPreview(mockFont);
      expect(preview).toBe('The quick brown fox jumps over the lazy dog');
    });
  });

  describe('isFontLoaded', () => {
    it('should return false for unloaded font', () => {
      const isLoaded = fontService.isFontLoaded('nonexistent-font');
      expect(isLoaded).toBe(false);
    });
  });

  describe('generateFontPreview', () => {
    it('should generate preview image', () => {
      const mockFont: HandwrittenFont = {
        id: 'test',
        name: 'Test',
        family: 'Arial',
        url: 'test.woff2',
      };
      
      const preview = fontService.generateFontPreview(mockFont);
      
      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
      expect(preview.startsWith('data:image/png')).toBe(true);
    });

    it('should generate preview with custom text', () => {
      const mockFont: HandwrittenFont = {
        id: 'test',
        name: 'Test',
        family: 'Arial',
        url: 'test.woff2',
      };
      
      const preview = fontService.generateFontPreview(mockFont, 'Custom text');
      
      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
    });
  });

  describe('clearLoadedFonts', () => {
    it('should clear loaded fonts', () => {
      fontService.clearLoadedFonts();
      
      const isLoaded = fontService.isFontLoaded('any-font');
      expect(isLoaded).toBe(false);
    });
  });
});
