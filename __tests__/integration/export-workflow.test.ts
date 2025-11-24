import { describe, it, expect, beforeEach } from 'vitest';
import { PDFExporter } from '@/lib/services/pdfExporter';
import { CanvasPage, HandwrittenFont } from '@/lib/types/canvas';

describe('Complete Export Workflow', () => {
  let pdfExporter: PDFExporter;
  const mockFont: HandwrittenFont = {
    id: 'test-font',
    name: 'Test Font',
    family: 'Arial',
    url: 'https://fonts.googleapis.com/css2?family=Caveat',
  };

  const mockPages: CanvasPage[] = [
    {
      pageNumber: 1,
      lines: [
        { text: 'This is line 1', x: 48, y: 48, fontSize: 18 },
        { text: 'This is line 2', x: 48, y: 80, fontSize: 18 },
      ],
      style: 'ruled',
    },
    {
      pageNumber: 2,
      lines: [
        { text: 'This is page 2 line 1', x: 48, y: 48, fontSize: 18 },
      ],
      style: 'ruled',
    },
  ];

  beforeEach(() => {
    pdfExporter = new PDFExporter();
  });

  it('should export pages to PDF blob', async () => {
    const blob = await pdfExporter.exportToPDF(
      mockPages,
      mockFont,
      '#000000',
      'ruled',
      { quality: 96 } // Lower quality for faster test
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  }, 30000);

  it('should estimate file size', () => {
    const estimatedSize = pdfExporter.estimateFileSize(2, 300);
    
    expect(estimatedSize).toBeGreaterThan(0);
    expect(typeof estimatedSize).toBe('number');
  });

  it('should format file size correctly', () => {
    expect(pdfExporter.formatFileSize(500)).toBe('500 B');
    expect(pdfExporter.formatFileSize(1024)).toBe('1.0 KB');
    expect(pdfExporter.formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('should validate export options', () => {
    const validOptions = {
      quality: 300,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    };

    const validation = pdfExporter.validateOptions(validOptions);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid export options', () => {
    const invalidOptions = {
      quality: 1000, // Too high
      batchSize: 0, // Too low
    };

    const validation = pdfExporter.validateOptions(invalidOptions);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should recommend progressive rendering for large documents', () => {
    const shouldUseProgressive = pdfExporter.shouldUseProgressive(25, 300);
    expect(shouldUseProgressive).toBe(true);

    const shouldNotUseProgressive = pdfExporter.shouldUseProgressive(5, 96);
    expect(shouldNotUseProgressive).toBe(false);
  });

  it('should calculate recommended batch size', () => {
    const batchSize300 = pdfExporter.getRecommendedBatchSize(50, 300);
    const batchSize600 = pdfExporter.getRecommendedBatchSize(50, 600);

    expect(batchSize600).toBeLessThan(batchSize300);
  });

  it('should estimate memory usage', () => {
    const memoryMB = pdfExporter.estimateMemoryUsage(10, 300);
    
    expect(memoryMB).toBeGreaterThan(0);
    expect(typeof memoryMB).toBe('number');
  });

  it('should track export progress', async () => {
    const progressUpdates: any[] = [];
    
    pdfExporter.setProgressCallback((progress) => {
      progressUpdates.push(progress);
    });

    await pdfExporter.exportToPDF(
      mockPages,
      mockFont,
      '#000000',
      'ruled',
      { quality: 96 }
    );

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0].stage).toBe('preparing');
    expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
  }, 30000);
});
