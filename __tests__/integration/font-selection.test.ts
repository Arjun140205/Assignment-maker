import { describe, it, expect, beforeEach } from 'vitest';
import { FontService } from '@/lib/services/fontService';
import { LayoutEngine } from '@/lib/utils/layoutEngine';
import { Answer } from '@/lib/types/ai-service';

describe('Font Selection to Display Update', () => {
  let fontService: FontService;
  let layoutEngine: LayoutEngine;

  beforeEach(() => {
    fontService = new FontService();
    layoutEngine = new LayoutEngine();
  });

  it('should load available fonts', async () => {
    const fonts = await fontService.loadFonts();
    
    expect(fonts).toBeDefined();
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts.length).toBeGreaterThan(0);
    
    // Verify font structure
    const font = fonts[0];
    expect(font.id).toBeDefined();
    expect(font.name).toBeDefined();
    expect(font.family).toBeDefined();
    expect(font.url).toBeDefined();
  });

  it('should update canvas when font is selected', async () => {
    const fonts = await fontService.loadFonts();
    const selectedFont = fonts[0];

    const answers: Answer[] = [
      {
        questionNumber: 1,
        content: 'Test content for font rendering.',
        wordCount: 5,
      },
    ];

    // Render with selected font
    const layout = layoutEngine.calculateLayout(answers, selectedFont, 'ruled');

    expect(layout.pages).toBeDefined();
    expect(layout.pages.length).toBeGreaterThan(0);
    expect(layout.pages[0].lines.length).toBeGreaterThan(0);
  });

  it('should search fonts by name', () => {
    const results = fontService.searchFonts('hand');
    
    expect(Array.isArray(results)).toBe(true);
    // Results should contain fonts with 'hand' in name or family
  });

  it('should get default font', () => {
    const defaultFont = fontService.getDefaultFont();
    
    expect(defaultFont).toBeDefined();
    expect(defaultFont.id).toBeDefined();
    expect(defaultFont.name).toBeDefined();
  });

  it('should generate font preview', () => {
    const defaultFont = fontService.getDefaultFont();
    const preview = fontService.generateFontPreview(defaultFont);
    
    expect(preview).toBeDefined();
    expect(typeof preview).toBe('string');
    expect(preview.startsWith('data:image/png')).toBe(true);
  });
});
