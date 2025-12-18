/**
 * Validation utility unit tests
 */

import { describe, it, expect } from 'vitest';
import {
    validatePrompt,
    validateFile,
    sanitizeText,
    sanitizeHTML,
    validateColor,
    validateWordCount,
    validateQuestionCount,
    validateFontId,
    validatePageStyle,
} from '@/lib/utils/validation';

describe('Validation Utilities', () => {
    describe('validatePrompt', () => {
        it('should accept valid prompts', () => {
            const result = validatePrompt('What is the capital of France?');
            expect(result.valid).toBe(true);
        });

        it('should reject empty prompts', () => {
            const result = validatePrompt('');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should reject whitespace-only prompts', () => {
            const result = validatePrompt('   \n\t  ');
            expect(result.valid).toBe(false);
        });

        it('should reject prompts that are too short', () => {
            const result = validatePrompt('Hi');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('10 characters');
        });

        it('should reject prompts that are too long', () => {
            const longPrompt = 'a'.repeat(5001);
            const result = validatePrompt(longPrompt);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('5000');
        });

        it('should return sanitized version for valid prompts', () => {
            const result = validatePrompt('What is photosynthesis?');
            expect(result.valid).toBe(true);
            expect(result.sanitized).toBeDefined();
        });
    });

    describe('validateFile', () => {
        const createMockFile = (name: string, type: string, size: number): File => {
            const content = new Uint8Array(size);
            const blob = new Blob([content], { type });
            return new File([blob], name, { type });
        };

        it('should accept valid PDF files', () => {
            const file = createMockFile('test.pdf', 'application/pdf', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid DOCX files', () => {
            const file = createMockFile(
                'test.docx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                1024
            );
            const result = validateFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid PNG images', () => {
            const file = createMockFile('test.png', 'image/png', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid JPEG images', () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid text files', () => {
            const file = createMockFile('test.txt', 'text/plain', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(true);
        });

        it('should reject unsupported file types', () => {
            const file = createMockFile('test.exe', 'application/x-executable', 1024);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('not supported');
        });

        it('should reject files that are too large', () => {
            const maxSize = 52428800; // 50MB default
            const file = createMockFile('large.pdf', 'application/pdf', maxSize + 1);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('size');
        });

        it('should reject empty files', () => {
            const file = createMockFile('empty.pdf', 'application/pdf', 0);
            const result = validateFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
        });
    });

    describe('sanitizeText', () => {
        it('should remove script tags', () => {
            const result = sanitizeText('<script>alert("xss")</script>Hello');
            expect(result).not.toContain('<script');
            expect(result).toContain('Hello');
        });

        it('should remove on* event handlers', () => {
            const result = sanitizeText('<img onerror="alert(1)" src="x">');
            expect(result).not.toContain('onerror');
        });

        it('should remove javascript: URLs', () => {
            const result = sanitizeText('<a href="javascript:alert(1)">Click</a>');
            expect(result).not.toContain('javascript:');
        });

        it('should preserve normal text', () => {
            const text = 'This is a normal text with no special characters.';
            const result = sanitizeText(text);
            expect(result).toBe(text);
        });
    });

    describe('sanitizeHTML', () => {
        it('should strip HTML tags', () => {
            const result = sanitizeHTML('<div>Test</div>');
            // The function strips HTML tags, leaving just the text content
            expect(result).toBe('Test');
        });

        it('should handle special characters', () => {
            const result = sanitizeHTML('Tom & Jerry');
            // Just verify it doesn't crash and returns a string
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('validateColor', () => {
        it('should accept valid 6-digit hex colors', () => {
            expect(validateColor('#000000').valid).toBe(true);
            expect(validateColor('#FFFFFF').valid).toBe(true);
            expect(validateColor('#ff0000').valid).toBe(true);
        });

        it('should accept valid 3-digit hex colors', () => {
            expect(validateColor('#abc').valid).toBe(true);
            expect(validateColor('#FFF').valid).toBe(true);
        });

        it('should reject invalid hex colors', () => {
            expect(validateColor('red').valid).toBe(false);
            expect(validateColor('rgb(255,0,0)').valid).toBe(false);
            expect(validateColor('#gg0000').valid).toBe(false);
            expect(validateColor('000000').valid).toBe(false);
        });
    });

    describe('validateWordCount', () => {
        it('should accept valid word counts', () => {
            expect(validateWordCount(100).valid).toBe(true);
            expect(validateWordCount(500).valid).toBe(true);
            expect(validateWordCount(1000).valid).toBe(true);
        });

        it('should accept undefined word count', () => {
            expect(validateWordCount(undefined).valid).toBe(true);
        });

        it('should reject zero or negative word counts', () => {
            expect(validateWordCount(0).valid).toBe(false);
            expect(validateWordCount(-10).valid).toBe(false);
        });

        it('should reject excessively large word counts', () => {
            expect(validateWordCount(10001).valid).toBe(false);
        });
    });

    describe('validateQuestionCount', () => {
        it('should accept valid question counts', () => {
            expect(validateQuestionCount(5).valid).toBe(true);
            expect(validateQuestionCount(10).valid).toBe(true);
        });

        it('should accept undefined question count', () => {
            expect(validateQuestionCount(undefined).valid).toBe(true);
        });

        it('should reject non-integer values', () => {
            expect(validateQuestionCount(5.5).valid).toBe(false);
        });

        it('should reject values over 100', () => {
            expect(validateQuestionCount(101).valid).toBe(false);
        });
    });

    describe('validateFontId', () => {
        it('should accept valid font IDs', () => {
            expect(validateFontId('caveat').valid).toBe(true);
            expect(validateFontId('homemade-apple').valid).toBe(true);
        });

        it('should reject empty font IDs', () => {
            expect(validateFontId('').valid).toBe(false);
        });
    });

    describe('validatePageStyle', () => {
        it('should accept valid page styles', () => {
            expect(validatePageStyle('ruled').valid).toBe(true);
            expect(validatePageStyle('lined').valid).toBe(true);
            expect(validatePageStyle('unruled').valid).toBe(true);
        });

        it('should reject invalid page styles', () => {
            expect(validatePageStyle('dotted').valid).toBe(false);
            expect(validatePageStyle('').valid).toBe(false);
        });
    });
});
