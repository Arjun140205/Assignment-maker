/**
 * Performance Testing Suite
 * Tests rendering performance, PDF export, and memory usage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LayoutEngine } from '@/lib/utils/layoutEngine';
import { PDFExporter } from '@/lib/services/pdfExporter';
import { Answer } from '@/lib/types/ai-service';
import { HandwrittenFont } from '@/lib/types/canvas';

describe('Performance Testing', () => {
  let layoutEngine: LayoutEngine;
  let pdfExporter: PDFExporter;
  const mockFont: HandwrittenFont = {
    id: 'test-font',
    name: 'Test Font',
    family: 'Arial',
    url: 'https://fonts.googleapis.com/css2?family=Caveat',
    preview: 'Test preview text',
  };

  beforeEach(() => {
    layoutEngine = new LayoutEngine();
    pdfExporter = new PDFExporter();
  });

  afterEach(() => {
    layoutEngine.destroy();
  });

  describe('Large Document Rendering (50+ pages)', () => {
    it('should render 50+ pages within acceptable time', () => {
      // Create large content that will span 50+ pages
      const longContent = 'This is a test sentence that will be repeated many times to create a large document. '.repeat(500);

      const largeAnswers: Answer[] = Array.from({ length: 10 }, (_, i) => ({
        questionNumber: i + 1,
        content: longContent,
        wordCount: 5000,
      }));

      const startTime = performance.now();

      const layout = layoutEngine.calculateLayout(largeAnswers, mockFont, 'ruled');

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(layout.totalPages).toBeGreaterThan(50);
      expect(renderTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Rendered ${layout.totalPages} pages in ${renderTime.toFixed(2)}ms`);
    });

    it('should handle memory efficiently for large documents', () => {
      const longContent = 'Test content. '.repeat(1000);

      const largeAnswers: Answer[] = Array.from({ length: 20 }, (_, i) => ({
        questionNumber: i + 1,
        content: longContent,
        wordCount: 2000,
      }));

      // Check cache stats before
      const statsBefore = layoutEngine.getCacheStats();

      layoutEngine.calculateLayout(largeAnswers, mockFont, 'ruled');

      // Check cache stats after
      const statsAfter = layoutEngine.getCacheStats();

      // Cache should be used but not grow unbounded
      expect(statsAfter.layoutCacheSize).toBeLessThanOrEqual(100);
      expect(statsAfter.lineCacheSize).toBeLessThanOrEqual(100);
    });
  });

  describe('Font Loading Performance', () => {
    it('should load fonts quickly', async () => {
      const startTime = performance.now();

      // Simulate font loading by creating layout
      layoutEngine.calculateLayout(
        [{ questionNumber: 1, content: 'Test content', wordCount: 2 }],
        mockFont,
        'ruled'
      );

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(1000); // Should load within 1 second

      console.log(`Font loaded and rendered in ${loadTime.toFixed(2)}ms`);
    });

    it('should cache font measurements', () => {
      const answers: Answer[] = [{ questionNumber: 1, content: 'Test content', wordCount: 2 }];

      // First render
      const start1 = performance.now();
      layoutEngine.calculateLayout(answers, mockFont, 'ruled');
      const time1 = performance.now() - start1;

      // Second render (should use cache)
      const start2 = performance.now();
      layoutEngine.calculateLayout(answers, mockFont, 'ruled');
      const time2 = performance.now() - start2;

      // Cached render should be faster
      expect(time2).toBeLessThan(time1);

      console.log(`First render: ${time1.toFixed(2)}ms, Cached render: ${time2.toFixed(2)}ms`);
    });
  });

  describe('Canvas Rendering Performance', () => {
    it('should render canvas efficiently', () => {
      const answers: Answer[] = Array.from({ length: 5 }, (_, i) => ({
        questionNumber: i + 1,
        content: 'This is test content for canvas rendering performance. '.repeat(20),
        wordCount: 100,
      }));

      const startTime = performance.now();

      const layout = layoutEngine.calculateLayout(answers, mockFont, 'ruled');

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(layout.pages.length).toBeGreaterThan(0);
      expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds

      console.log(`Canvas rendered ${layout.pages.length} pages in ${renderTime.toFixed(2)}ms`);
    });

    it('should handle rapid re-renders efficiently', () => {
      const answers: Answer[] = [{ questionNumber: 1, content: 'Test', wordCount: 1 }];

      const renderTimes: number[] = [];

      // Perform 10 rapid re-renders
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        layoutEngine.calculateLayout(answers, mockFont, 'ruled');
        renderTimes.push(performance.now() - start);
      }

      // Average render time should be reasonable
      const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      expect(avgTime).toBeLessThan(100); // Average should be under 100ms

      console.log(`Average render time over 10 renders: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('PDF Export Performance', () => {
    it('should export PDF within acceptable time', async () => {
      const answers: Answer[] = Array.from({ length: 3 }, (_, i) => ({
        questionNumber: i + 1,
        content: 'Test content for PDF export. '.repeat(50),
        wordCount: 150,
      }));

      const layout = layoutEngine.calculateLayout(answers, mockFont, 'ruled');

      const startTime = performance.now();

      const blob = await pdfExporter.exportToPDF(
        layout.pages,
        mockFont,
        '#000000',
        'ruled',
        { quality: 96 } // Lower quality for faster test
      );

      const endTime = performance.now();
      const exportTime = endTime - startTime;

      expect(blob.size).toBeGreaterThan(0);
      expect(exportTime).toBeLessThan(10000); // Should export within 10 seconds

      console.log(`Exported ${layout.pages.length} pages to PDF in ${exportTime.toFixed(2)}ms`);
      console.log(`PDF size: ${pdfExporter.formatFileSize(blob.size)}`);
    }, 30000);

    it('should estimate export speed accurately', async () => {
      const pageCount = 5;
      const answers: Answer[] = Array.from({ length: pageCount }, (_, i) => ({
        questionNumber: i + 1,
        content: 'Test content. '.repeat(30),
        wordCount: 60,
      }));

      const layout = layoutEngine.calculateLayout(answers, mockFont, 'ruled');

      const startTime = performance.now();
      await pdfExporter.exportToPDF(layout.pages, mockFont, '#000000', 'ruled', { quality: 96 });
      const actualTime = performance.now() - startTime;

      const timePerPage = actualTime / layout.pages.length;

      expect(timePerPage).toBeLessThan(2000); // Should be under 2 seconds per page

      console.log(`Export speed: ${timePerPage.toFixed(2)}ms per page`);
    }, 30000);
  });

  describe('Memory Usage Monitoring', () => {
    it('should not leak memory during repeated operations', () => {
      const answers: Answer[] = [{ questionNumber: 1, content: 'Test content', wordCount: 2 }];

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        layoutEngine.calculateLayout(answers, mockFont, 'ruled');
      }

      // Check cache hasn't grown unbounded
      const stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBeLessThanOrEqual(100);
      expect(stats.lineCacheSize).toBeLessThanOrEqual(100);
    });

    it('should clear cache when configuration changes', () => {
      const answers: Answer[] = [{ questionNumber: 1, content: 'Test', wordCount: 1 }];

      // Build up cache
      layoutEngine.calculateLayout(answers, mockFont, 'ruled');

      let stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBeGreaterThan(0);

      // Change configuration (should clear cache)
      layoutEngine.updateConfig({ lineHeight: 40 });

      stats = layoutEngine.getCacheStats();
      expect(stats.layoutCacheSize).toBe(0);
      expect(stats.lineCacheSize).toBe(0);
    });

    it('should estimate memory usage for large exports', () => {
      const memoryMB = pdfExporter.estimateMemoryUsage(50, 300);

      expect(memoryMB).toBeGreaterThan(0);
      expect(memoryMB).toBeLessThan(5000); // High DPI requires significant memory

      console.log(`Estimated memory for 50 pages at 300 DPI: ${memoryMB}MB`);
    });
  });

  describe('Optimization Verification', () => {
    it('should use progressive rendering for large documents', () => {
      const shouldUseProgressive = pdfExporter.shouldUseProgressive(25, 300);
      expect(shouldUseProgressive).toBe(true);
    });

    it('should recommend appropriate batch sizes', () => {
      const batchSize = pdfExporter.getRecommendedBatchSize(50, 300);
      expect(batchSize).toBeGreaterThan(0);
      expect(batchSize).toBeLessThanOrEqual(10);
    });

    it('should validate performance-critical options', () => {
      const validation = pdfExporter.validateOptions({
        quality: 300,
        batchSize: 5,
        memoryLimit: 100,
      });

      expect(validation.valid).toBe(true);
    });
  });
});
