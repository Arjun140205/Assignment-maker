import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TextMeasurement,
  createDefaultMargins,
  createDefaultPadding,
  getTextMeasurement,
} from '../textMeasurement';
import { HandwrittenFont } from '@/lib/types/canvas';

describe('TextMeasurement', () => {
  let textMeasurement: TextMeasurement;
  const mockFont: HandwrittenFont = {
    id: 'test-font',
    name: 'Test Font',
    family: 'Test Family',
    url: 'https://example.com/font.woff2',
    preview: 'Test preview',
  };

  beforeEach(() => {
    textMeasurement = new TextMeasurement();
  });

  afterEach(() => {
    textMeasurement.destroy();
  });

  describe('measureTextWidth', () => {
    it('should measure text width', () => {
      const width = textMeasurement.measureTextWidth('Hello World', mockFont, 18);
      expect(width).toBeGreaterThan(0);
    });

    it('should cache measurements', () => {
      const text = 'Test text';
      const width1 = textMeasurement.measureTextWidth(text, mockFont, 18);
      const width2 = textMeasurement.measureTextWidth(text, mockFont, 18);
      expect(width1).toBe(width2);
      
      const stats = textMeasurement.getCacheStats();
      expect(stats.widthCacheSize).toBeGreaterThan(0);
    });

    it('should return different widths for different text', () => {
      const width1 = textMeasurement.measureTextWidth('Short', mockFont, 18);
      const width2 = textMeasurement.measureTextWidth('Much longer text', mockFont, 18);
      expect(width2).toBeGreaterThan(width1);
    });
  });

  describe('getTextMetrics', () => {
    it('should return text metrics', () => {
      const metrics = textMeasurement.getTextMetrics('Test', mockFont, 18);
      expect(metrics.width).toBeGreaterThan(0);
      expect(metrics.height).toBeGreaterThan(0);
      expect(metrics.actualBoundingBoxAscent).toBeGreaterThan(0);
      expect(metrics.actualBoundingBoxDescent).toBeGreaterThan(0);
    });

    it('should cache metrics', () => {
      const text = 'Test';
      const metrics1 = textMeasurement.getTextMetrics(text, mockFont, 18);
      const metrics2 = textMeasurement.getTextMetrics(text, mockFont, 18);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('calculateLineHeight', () => {
    it('should calculate line height with default spacing', () => {
      const lineHeight = textMeasurement.calculateLineHeight(mockFont, 18);
      expect(lineHeight).toBeGreaterThan(0);
    });

    it('should calculate line height with custom spacing', () => {
      const lineHeight1 = textMeasurement.calculateLineHeight(mockFont, 18, 1.0);
      const lineHeight2 = textMeasurement.calculateLineHeight(mockFont, 18, 2.0);
      expect(lineHeight2).toBeGreaterThan(lineHeight1);
    });
  });

  describe('dimension calculations', () => {
    const margins = { top: 48, bottom: 48, left: 48, right: 48 };
    const padding = { top: 10, bottom: 10, left: 10, right: 10 };

    it('should calculate available width', () => {
      const width = textMeasurement.calculateAvailableWidth(800, margins);
      expect(width).toBe(800 - 48 - 48);
    });

    it('should calculate available height', () => {
      const height = textMeasurement.calculateAvailableHeight(1000, margins);
      expect(height).toBe(1000 - 48 - 48);
    });

    it('should calculate content area', () => {
      const area = textMeasurement.calculateContentArea(800, 1000, margins, padding);
      expect(area.width).toBe(800 - 48 - 48 - 10 - 10);
      expect(area.height).toBe(1000 - 48 - 48 - 10 - 10);
      expect(area.x).toBe(48 + 10);
      expect(area.y).toBe(48 + 10);
    });
  });

  describe('unit conversions', () => {
    it('should convert inches to pixels', () => {
      const pixels = textMeasurement.inchesToPixels(1, 96);
      expect(pixels).toBe(96);
    });

    it('should convert pixels to inches', () => {
      const inches = textMeasurement.pixelsToInches(96, 96);
      expect(inches).toBe(1);
    });
  });

  describe('calculateMaxLines', () => {
    it('should calculate max lines that fit', () => {
      const maxLines = textMeasurement.calculateMaxLines(320, 32);
      expect(maxLines).toBe(10);
    });

    it('should handle fractional results', () => {
      const maxLines = textMeasurement.calculateMaxLines(325, 32);
      expect(maxLines).toBe(10);
    });
  });

  describe('fitsWithinWidth', () => {
    it('should return true when text fits', () => {
      const fits = textMeasurement.fitsWithinWidth('Hi', 1000, mockFont, 18);
      expect(fits).toBe(true);
    });

    it('should return false when text does not fit', () => {
      const fits = textMeasurement.fitsWithinWidth('Very long text that should not fit', 10, mockFont, 18);
      expect(fits).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      textMeasurement.measureTextWidth('Test', mockFont, 18);
      textMeasurement.getTextMetrics('Test', mockFont, 18);
      
      let stats = textMeasurement.getCacheStats();
      expect(stats.widthCacheSize).toBeGreaterThan(0);
      expect(stats.metricsCacheSize).toBeGreaterThan(0);
      
      textMeasurement.clearCache();
      
      stats = textMeasurement.getCacheStats();
      expect(stats.widthCacheSize).toBe(0);
      expect(stats.metricsCacheSize).toBe(0);
    });
  });
});

describe('Helper functions', () => {
  describe('createDefaultMargins', () => {
    it('should create margins with 0.5 inch at 96 DPI', () => {
      const margins = createDefaultMargins(96);
      expect(margins.top).toBe(48);
      expect(margins.bottom).toBe(48);
      expect(margins.left).toBe(48);
      expect(margins.right).toBe(48);
    });

    it('should scale with DPI', () => {
      const margins = createDefaultMargins(192);
      expect(margins.top).toBe(96);
    });
  });

  describe('createDefaultPadding', () => {
    it('should create zero padding', () => {
      const padding = createDefaultPadding();
      expect(padding.top).toBe(0);
      expect(padding.bottom).toBe(0);
      expect(padding.left).toBe(0);
      expect(padding.right).toBe(0);
    });
  });

  describe('getTextMeasurement', () => {
    it('should return singleton instance', () => {
      const instance1 = getTextMeasurement();
      const instance2 = getTextMeasurement();
      expect(instance1).toBe(instance2);
    });
  });
});
