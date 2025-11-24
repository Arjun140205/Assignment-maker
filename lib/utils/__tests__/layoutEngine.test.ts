import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LayoutEngine, createDefaultLayoutConfig } from '../layoutEngine';
import { Answer } from '@/lib/types/ai-service';
import { HandwrittenFont, PageStyle } from '@/lib/types/canvas';

describe('LayoutEngine', () => {
  let layoutEngine: LayoutEngine;
  const mockFont: HandwrittenFont = {
    id: 'test-font',
    name: 'Test Font',
    family: 'Test Family',
    url: 'https://example.com/font.woff2',
    preview: 'Test preview',
  };

  const mockAnswers: Answer[] = [
    {
      questionNumber: 1,
      content: 'This is the first answer with some content.',
      wordCount: 8,
    },
    {
      questionNumber: 2,
      content: 'This is the second answer with more content to test layout.',
      wordCount: 11,
    },
  ];

  beforeEach(() => {
    layoutEngine = new LayoutEngine();
  });

  afterEach(() => {
    layoutEngine.destroy();
  });

  describe('calculateLayout', () => {
    it('should calculate layout for answers', () => {
      const result = layoutEngine.calculateLayout(mockAnswers, mockFont, 'ruled');
      
      expect(result.pages).toBeDefined();
      expect(result.totalPages).toBeGreaterThan(0);
      expect(result.totalLines).toBeGreaterThan(0);
      expect(result.pages[0].pageNumber).toBe(1);
    });

    it('should cache layout results', () => {
      const result1 = layoutEngine.calculateLayout(mockAnswers, mockFont, 'ruled');
      const result2 = layoutEngine.calculateLayout(mockAnswers, mockFont, 'ruled');
      
      expect(result1).toEqual(result2);
      
      const stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBeGreaterThan(0);
    });

    it('should handle different page styles', () => {
      const styles: PageStyle[] = ['ruled', 'unruled', 'lined'];
      
      styles.forEach(style => {
        const result = layoutEngine.calculateLayout(mockAnswers, mockFont, style);
        expect(result.pages[0].style).toBe(style);
      });
    });
  });

  describe('splitIntoLines', () => {
    it('should split text into lines', () => {
      const text = 'This is a test text that should be split into multiple lines.';
      const lines = layoutEngine.splitIntoLines(text, mockFont);
      
      expect(lines).toBeDefined();
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should preserve paragraph breaks', () => {
      const text = 'First paragraph.\n\nSecond paragraph.';
      const lines = layoutEngine.splitIntoLines(text, mockFont);
      
      expect(lines).toContain('');
    });

    it('should cache line splits', () => {
      const text = 'Test text for caching';
      layoutEngine.splitIntoLines(text, mockFont);
      layoutEngine.splitIntoLines(text, mockFont);
      
      const stats = layoutEngine.getCacheStats();
      expect(stats.lineCacheSize).toBeGreaterThan(0);
    });
  });

  describe('calculateLinePosition', () => {
    it('should calculate line position', () => {
      const position = layoutEngine.calculateLinePosition(0);
      const config = layoutEngine.getConfig();
      
      expect(position).toBe(config.marginTop);
    });

    it('should calculate position for subsequent lines', () => {
      const config = layoutEngine.getConfig();
      const position1 = layoutEngine.calculateLinePosition(0);
      const position2 = layoutEngine.calculateLinePosition(1);
      
      expect(position2).toBe(position1 + config.lineHeight);
    });
  });

  describe('estimatePageCount', () => {
    it('should estimate page count', () => {
      const pageCount = layoutEngine.estimatePageCount(mockAnswers, mockFont);
      
      expect(pageCount).toBeGreaterThan(0);
      expect(Number.isInteger(pageCount)).toBe(true);
    });

    it('should estimate more pages for longer content', () => {
      const shortAnswers: Answer[] = [
        { questionNumber: 1, content: 'Short', wordCount: 1 },
      ];
      
      const longAnswers: Answer[] = [
        {
          questionNumber: 1,
          content: 'This is a much longer answer with significantly more content that should require multiple pages to display properly. '.repeat(50),
          wordCount: 500,
        },
      ];
      
      const shortPages = layoutEngine.estimatePageCount(shortAnswers, mockFont);
      const longPages = layoutEngine.estimatePageCount(longAnswers, mockFont);
      
      expect(longPages).toBeGreaterThan(shortPages);
    });
  });

  describe('configuration management', () => {
    it('should get configuration', () => {
      const config = layoutEngine.getConfig();
      
      expect(config.pageWidth).toBeDefined();
      expect(config.pageHeight).toBeDefined();
      expect(config.marginTop).toBeDefined();
      expect(config.lineHeight).toBeDefined();
    });

    it('should update configuration', () => {
      const newLineHeight = 40;
      layoutEngine.updateConfig({ lineHeight: newLineHeight });
      
      const config = layoutEngine.getConfig();
      expect(config.lineHeight).toBe(newLineHeight);
    });

    it('should clear cache when configuration changes', () => {
      layoutEngine.calculateLayout(mockAnswers, mockFont, 'ruled');
      
      let stats = layoutEngine.getCacheStats();
      const initialCacheSize = stats.layoutCacheSize;
      
      layoutEngine.updateConfig({ lineHeight: 40 });
      
      stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBe(0);
    });
  });

  describe('getMargins', () => {
    it('should return margins', () => {
      const margins = layoutEngine.getMargins();
      
      expect(margins.top).toBeDefined();
      expect(margins.bottom).toBeDefined();
      expect(margins.left).toBeDefined();
      expect(margins.right).toBeDefined();
    });
  });

  describe('cache management', () => {
    it('should clear all caches', () => {
      layoutEngine.calculateLayout(mockAnswers, mockFont, 'ruled');
      layoutEngine.splitIntoLines('Test text', mockFont);
      
      let stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBeGreaterThan(0);
      expect(stats.lineCacheSize).toBeGreaterThan(0);
      
      layoutEngine.clearCache();
      
      stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBe(0);
      expect(stats.lineCacheSize).toBe(0);
    });
  });
});

describe('createDefaultLayoutConfig', () => {
  it('should create default configuration', () => {
    const config = createDefaultLayoutConfig();
    
    expect(config.pageWidth).toBe(794);
    expect(config.pageHeight).toBe(1123);
    expect(config.marginTop).toBe(48);
    expect(config.lineHeight).toBe(32);
    expect(config.fontSize).toBe(18);
    expect(config.answerSpacing).toBe(1);
  });
});
