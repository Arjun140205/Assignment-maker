/**
 * Layout Engine unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutEngine, LayoutConfig } from '@/lib/utils/layoutEngine';
import { Answer } from '@/lib/types/ai-service';
import { PageStyle, HandwrittenFont } from '@/lib/types/canvas';

describe('LayoutEngine', () => {
    const mockFont: HandwrittenFont = {
        id: 'test-font',
        name: 'Test Font',
        family: 'Caveat',
        url: 'https://fonts.googleapis.com/css2?family=Caveat',
        preview: 'Test preview text',
    };

    describe('constructor', () => {
        it('should create with default config', () => {
            const engine = new LayoutEngine();
            expect(engine).toBeDefined();
        });

        it('should accept custom config', () => {
            const customConfig: Partial<LayoutConfig> = {
                pageWidth: 800,
                pageHeight: 1200,
                marginTop: 80,
                marginBottom: 80,
            };
            const engine = new LayoutEngine(customConfig);
            expect(engine).toBeDefined();
        });
    });

    describe('calculateLayout', () => {
        let engine: LayoutEngine;

        beforeEach(() => {
            engine = new LayoutEngine();
        });

        it('should return empty pages for empty answers', () => {
            const result = engine.calculateLayout([], mockFont, 'ruled');
            expect(result.pages).toHaveLength(0);
            expect(result.totalPages).toBe(0);
            expect(result.totalLines).toBe(0);
        });

        it('should calculate layout for single answer', () => {
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'React is a JavaScript library for building user interfaces.',
                    wordCount: 10,
                },
            ];

            const result = engine.calculateLayout(answers, mockFont, 'ruled');
            expect(result.pages.length).toBeGreaterThan(0);
            expect(result.totalLines).toBeGreaterThan(0);
        });

        it('should calculate layout for multiple answers', () => {
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Answer 1 content here.',
                    wordCount: 5,
                },
                {
                    questionNumber: 2,
                    content: 'Answer 2 content here.',
                    wordCount: 5,
                },
                {
                    questionNumber: 3,
                    content: 'Answer 3 content here.',
                    wordCount: 5,
                },
            ];

            const result = engine.calculateLayout(answers, mockFont, 'ruled');
            expect(result.pages.length).toBeGreaterThan(0);
            expect(result.totalPages).toBe(result.pages.length);
        });

        it('should handle long text that spans multiple pages', () => {
            const longContent = 'This is a long answer that should span multiple pages. '.repeat(200);
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: longContent,
                    wordCount: 2000,
                },
            ];

            const result = engine.calculateLayout(answers, mockFont, 'ruled');
            expect(result.pages.length).toBeGreaterThan(1);
        });

        it('should apply correct page style to all pages', () => {
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Long answer content. '.repeat(100),
                    wordCount: 300,
                },
            ];

            const pageStyles: PageStyle[] = ['ruled', 'lined', 'unruled'];

            pageStyles.forEach((style) => {
                const result = engine.calculateLayout(answers, mockFont, style);
                result.pages.forEach((page) => {
                    expect(page.style).toBe(style);
                });
            });
        });

        it('should cache layout results', () => {
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Answer content',
                    wordCount: 2,
                },
            ];

            // First call - should calculate
            const result1 = engine.calculateLayout(answers, mockFont, 'ruled');

            // Second call with same params - should use cache
            const result2 = engine.calculateLayout(answers, mockFont, 'ruled');

            // Results should be identical (same object from cache)
            expect(result1).toEqual(result2);
        });

        it('should invalidate cache when page style changes', () => {
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Answer content',
                    wordCount: 2,
                },
            ];

            const result1 = engine.calculateLayout(answers, mockFont, 'ruled');
            const result2 = engine.calculateLayout(answers, mockFont, 'lined');

            // Results should be different since page style changed
            expect(result1.pages[0]?.style).toBe('ruled');
            expect(result2.pages[0]?.style).toBe('lined');
        });
    });

    describe('page numbering', () => {
        it('should assign sequential page numbers', () => {
            const engine = new LayoutEngine();
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Long answer text for multiple pages. '.repeat(150),
                    wordCount: 900,
                },
            ];

            const result = engine.calculateLayout(answers, mockFont, 'ruled');

            result.pages.forEach((page, index) => {
                expect(page.pageNumber).toBe(index + 1);
            });
        });
    });

    describe('line positioning', () => {
        it('should position lines within page margins', () => {
            const engine = new LayoutEngine({
                marginLeft: 70,
                marginRight: 50,
                marginTop: 60,
                marginBottom: 60,
                pageWidth: 794,
                pageHeight: 1123,
            });

            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Answer text for testing line positioning.',
                    wordCount: 7,
                },
            ];

            const result = engine.calculateLayout(answers, mockFont, 'ruled');

            result.pages.forEach((page) => {
                page.lines.forEach((line) => {
                    // Check x is within left margin
                    expect(line.x).toBeGreaterThanOrEqual(70);
                    // Check y is within top margin
                    expect(line.y).toBeGreaterThanOrEqual(60);
                    // Check y is within bottom margin
                    expect(line.y).toBeLessThanOrEqual(1123 - 60);
                });
            });
        });
    });

    describe('clearCache', () => {
        it('should clear the layout cache', () => {
            const engine = new LayoutEngine();
            const answers: Answer[] = [
                {
                    questionNumber: 1,
                    content: 'Answer content',
                    wordCount: 2,
                },
            ];

            // Populate cache
            engine.calculateLayout(answers, mockFont, 'ruled');

            // Clear cache
            engine.clearCache();

            // This should recalculate (no way to directly verify, but shouldn't error)
            const result = engine.calculateLayout(answers, mockFont, 'ruled');
            expect(result.pages.length).toBeGreaterThan(0);
        });
    });
});
