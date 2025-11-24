import { describe, it, expect, beforeEach } from 'vitest';
import { FileProcessor } from '../fileProcessor';
import { FileProcessingErrorCode } from '@/lib/types/file-processing';

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor;

  beforeEach(() => {
    fileProcessor = new FileProcessor();
  });

  describe('validateFile', () => {
    it('should accept valid PDF file', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      await expect(fileProcessor.validateFile(file)).resolves.not.toThrow();
    });

    it('should accept valid DOCX file', async () => {
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      
      await expect(fileProcessor.validateFile(file)).resolves.not.toThrow();
    });

    it('should accept valid image files', async () => {
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' });
      const jpgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(fileProcessor.validateFile(pngFile)).resolves.not.toThrow();
      await expect(fileProcessor.validateFile(jpgFile)).resolves.not.toThrow();
    });

    it('should accept valid text file', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await expect(fileProcessor.validateFile(file)).resolves.not.toThrow();
    });

    it('should reject file that is too large', async () => {
      // Create a file that reports a large size without actually allocating memory
      const file = new File(['small content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });
      
      await expect(fileProcessor.validateFile(file)).rejects.toThrow();
    });

    it('should reject unsupported file type', async () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      
      await expect(fileProcessor.validateFile(file)).rejects.toThrow();
    });

    it('should reject empty file', async () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      
      await expect(fileProcessor.validateFile(file)).rejects.toThrow();
    });
  });

  describe('processText', () => {
    it('should process plain text file', async () => {
      const content = 'This is test content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      
      const result = await fileProcessor.processText(file);
      
      expect(result).toBe(content);
    });

    it('should reject empty text file', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      
      await expect(fileProcessor.processText(file)).rejects.toThrow();
    });

    it('should reject whitespace-only text file', async () => {
      const file = new File(['   \n\t  '], 'whitespace.txt', { type: 'text/plain' });
      
      await expect(fileProcessor.processText(file)).rejects.toThrow();
    });
  });

  describe('processFile', () => {
    it('should process text file and return extracted content', async () => {
      const content = 'Test content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      
      const result = await fileProcessor.processFile(file);
      
      expect(result.text).toBe(content);
      expect(result.metadata.fileName).toBe('test.txt');
      expect(result.metadata.fileType).toBe('text/plain');
      expect(result.metadata.fileSize).toBe(file.size);
      expect(result.metadata.extractedAt).toBeInstanceOf(Date);
    });

    it('should validate file before processing', async () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      
      await expect(fileProcessor.processFile(file)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw FileProcessingError with correct code for large file', async () => {
      const file = new File(['small content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });
      
      try {
        await fileProcessor.validateFile(file);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe(FileProcessingErrorCode.FILE_TOO_LARGE);
      }
    });

    it('should throw FileProcessingError with correct code for invalid type', async () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      
      try {
        await fileProcessor.validateFile(file);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe(FileProcessingErrorCode.INVALID_FILE_TYPE);
      }
    });

    it('should throw FileProcessingError with correct code for empty content', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      
      try {
        await fileProcessor.processText(file);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe(FileProcessingErrorCode.EMPTY_CONTENT);
      }
    });
  });
});
