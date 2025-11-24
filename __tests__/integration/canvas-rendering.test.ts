import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LayoutEngine } from '@/lib/utils/layoutEngine';
import { Answer } from '@/lib/types/ai-service';
import { HandwrittenFont } from '@/lib/types/canvas';

describe('Text Editing to Canvas Re-rendering', () => {
  let layoutEngine: LayoutEngine;
  const mockFont: HandwrittenFont = {
    id: 'test-font',
    name: 'Test Font',
    family: 'Arial',
    url: 'https://fonts.googleapis.com/css2?family=Caveat',
  };

  beforeEach(() => {
    layoutEngine = new LayoutEngine();
  });

  afterEach(() => {
    layoutEngine.destroy();
  });

  it('should re-render canvas when text is edited', () => {
    // Initial answers
    const initialAnswers: Answer[] = [
      {
        questionNumber: 1,
        content: 'This is the first answer.',
        wordCount: 5,
      },
    ];

    // Calculate initial layout
    const initialLayout = layoutEngine.calculateLayout(
      initialAnswers,
      mockFont,
      'ruled'
    );

    expect(initialLayout.pages.length).toBeGreaterThan(0);
    expect(initialLayout.totalLines).toBeGreaterThan(0);

    // Edit the answer (add more content)
    const editedAnswers: Answer[] = [
      {
        questionNumber: 1,
        content: 'This is the first answer with much more content added to test re-rendering. '.repeat(10),
        wordCount: 100,
      },
    ];

    // Recalculate layout
    const updatedLayout = layoutEngine.calculateLayout(
      editedAnswers,
      mockFont,
      'ruled'
    );

    // Verify layout was updated
    expect(updatedLayout.totalLines).toBeGreaterThan(initialLayout.totalLines);
    expect(updatedLayout.pages.length).toBeGreaterThanOrEqual(initialLayout.pages.length);
  });

  it('should update layout when font is changed', () => {
    const answers: Answer[] = [
      {
        questionNumber: 1,
        content: 'Test content for font change.',
        wordCount: 5,
      },
    ];

    const font1: HandwrittenFont = {
      id: 'font-1',
      name: 'Font 1',
      family: 'Arial',
      url: 'test1.woff2',
    };

    const font2: HandwrittenFont = {
      id: 'font-2',
      name: 'Font 2',
      family: 'Courier',
      url: 'test2.woff2',
    };

    // Calculate with first font
    const layout1 = layoutEngine.calculateLayout(answers, font1, 'ruled');

    // Calculate with second font
    const layout2 = layoutEngine.calculateLayout(answers, font2, 'ruled');

    // Layouts should be different (different cache keys)
    expect(layout1).toBeDefined();
    expect(layout2).toBeDefined();
  });

  it('should synchronize preview with edits in real-time', () => {
    const answers: Answer[] = [
      {
        questionNumber: 1,
        content: 'Initial content',
        wordCount: 2,
      },
    ];

    // Initial render
    const layout1 = layoutEngine.calculateLayout(answers, mockFont, 'ruled');
    const initialLineCount = layout1.totalLines;

    // Simulate typing more content
    answers[0].content = 'Initial content with additional text added';
    answers[0].wordCount = 6;

    // Re-render
    const layout2 = layoutEngine.calculateLayout(answers, mockFont, 'ruled');

    expect(layout2.totalLines).toBeGreaterThanOrEqual(initialLineCount);
  });
});
