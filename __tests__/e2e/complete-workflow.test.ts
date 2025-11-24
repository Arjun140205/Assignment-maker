import { describe, it, expect, beforeEach } from 'vitest';
import { FileProcessor } from '@/lib/services/fileProcessor';
import { AIService } from '@/lib/services/aiService';
import { LayoutEngine } from '@/lib/utils/layoutEngine';
import { PDFExporter } from '@/lib/services/pdfExporter';
import { FontService } from '@/lib/services/fontService';
import { HandwrittenFont } from '@/lib/types/canvas';

describe('Complete User Workflow (Upload → Generate → Edit → Export)', () => {
  let fileProcessor: FileProcessor;
  let aiService: AIService;
  let layoutEngine: LayoutEngine;
  let pdfExporter: PDFExporter;
  let fontService: FontService;
  let selectedFont: HandwrittenFont;

  beforeEach(async () => {
    fileProcessor = new FileProcessor();
    
    const apiKey = process.env.OPENAI_API_KEY || '';
    aiService = new AIService({
      provider: 'openai',
      apiKey,
      timeout: 30000,
    });
    
    layoutEngine = new LayoutEngine();
    pdfExporter = new PDFExporter();
    fontService = new FontService();
    
    // Load fonts and select default
    const fonts = await fontService.loadFonts();
    selectedFont = fonts[0];
  });

  it.skip('should complete full workflow from file upload to PDF export', async () => {
    // Step 1: Upload and process file
    const fileContent = 'Artificial Intelligence (AI) is transforming technology. Machine learning enables computers to learn from data.';
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
    
    const extracted = await fileProcessor.processFile(file);
    expect(extracted.text).toBe(fileContent);
    expect(extracted.metadata.fileName).toBe('test.txt');

    // Step 2: Generate answers using AI
    const generationResponse = await aiService.generateAnswers({
      prompt: 'Write 2 short answers (50 words each) about AI and machine learning based on the context.',
      context: extracted.text,
    });

    expect(generationResponse.answers).toBeDefined();
    expect(generationResponse.answers.length).toBeGreaterThan(0);
    expect(generationResponse.totalWords).toBeGreaterThan(0);

    // Step 3: Edit answers (simulate user editing)
    const editedAnswers = generationResponse.answers.map(answer => ({
      ...answer,
      content: answer.content + ' [Edited by user]',
      wordCount: answer.wordCount + 3,
    }));

    // Step 4: Calculate layout for canvas rendering
    const layout = layoutEngine.calculateLayout(editedAnswers, selectedFont, 'ruled');
    
    expect(layout.pages).toBeDefined();
    expect(layout.pages.length).toBeGreaterThan(0);
    expect(layout.totalPages).toBeGreaterThan(0);
    expect(layout.totalLines).toBeGreaterThan(0);

    // Step 5: Export to PDF
    const pdfBlob = await pdfExporter.exportToPDF(
      layout.pages,
      selectedFont,
      '#000000',
      'ruled',
      { quality: 96 } // Lower quality for faster test
    );

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(0);
  }, 90000); // 90 second timeout for full workflow

  it('should handle different file formats', async () => {
    const formats = [
      { content: 'Plain text content', name: 'test.txt', type: 'text/plain' },
    ];

    for (const format of formats) {
      const file = new File([format.content], format.name, { type: format.type });
      const extracted = await fileProcessor.processFile(file);
      
      expect(extracted.text).toBeDefined();
      expect(extracted.text.length).toBeGreaterThan(0);
      expect(extracted.metadata.fileType).toBe(format.type);
    }
  });

  it.skip('should handle font changes and re-render', async () => {
    const content = 'Test content for font changes.';
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    
    const extracted = await fileProcessor.processFile(file);
    
    const response = await aiService.generateAnswers({
      prompt: 'Write 1 short answer about the content.',
      context: extracted.text,
    });

    // Get available fonts
    const fonts = await fontService.loadFonts();
    expect(fonts.length).toBeGreaterThan(1);

    // Render with first font
    const layout1 = layoutEngine.calculateLayout(response.answers, fonts[0], 'ruled');
    expect(layout1.pages.length).toBeGreaterThan(0);

    // Change font and re-render
    const layout2 = layoutEngine.calculateLayout(response.answers, fonts[1], 'ruled');
    expect(layout2.pages.length).toBeGreaterThan(0);
  }, 90000);

  it.skip('should synchronize preview with real-time edits', async () => {
    const content = 'Initial content for testing.';
    const file = new File([content], 'test.txt', { type: 'text/plain' });
    
    const extracted = await fileProcessor.processFile(file);
    
    const response = await aiService.generateAnswers({
      prompt: 'Write 1 answer.',
      context: extracted.text,
    });

    // Initial render
    const initialLayout = layoutEngine.calculateLayout(response.answers, selectedFont, 'ruled');
    const initialLineCount = initialLayout.totalLines;

    // Simulate user editing (adding more content)
    response.answers[0].content += ' Additional content added by user to test real-time preview synchronization.';
    response.answers[0].wordCount += 10;

    // Re-render with edited content
    const updatedLayout = layoutEngine.calculateLayout(response.answers, selectedFont, 'ruled');
    
    expect(updatedLayout.totalLines).toBeGreaterThan(initialLineCount);
  }, 90000);
});
