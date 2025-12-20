/**
 * File processing service for extracting text from various file formats
 */

import {
  ExtractedContent,
  FileProcessingError,
  FileProcessingErrorCode,
  IFileProcessor,
  FileProcessingConfig,
} from '@/lib/types/file-processing';

// Dynamic imports for heavy libraries
// pdf-parse is a CommonJS module, use require in server context
const getPdfParse = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  return pdfParse;
};
const getMammoth = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth');
  return mammoth;
};
const getTesseract = () => import('tesseract.js');

/**
 * Default configuration for file processing
 */
const DEFAULT_CONFIG: FileProcessingConfig = {
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800', 10), // 50MB
  supportedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
  ],
  ocrLanguage: 'eng',
};

/**
 * FileProcessor class for handling file uploads and text extraction
 */
export class FileProcessor implements IFileProcessor {
  private config: FileProcessingConfig;

  constructor(config?: Partial<FileProcessingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate file before processing
   */
  async validateFile(file: File): Promise<void> {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      throw new FileProcessingError(
        `File size exceeds maximum allowed size of ${this.config.maxFileSize / 1024 / 1024}MB`,
        file.type,
        FileProcessingErrorCode.FILE_TOO_LARGE
      );
    }

    // Check file type
    if (!this.config.supportedTypes.includes(file.type)) {
      throw new FileProcessingError(
        `File type ${file.type} is not supported`,
        file.type,
        FileProcessingErrorCode.INVALID_FILE_TYPE
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new FileProcessingError(
        'File is empty',
        file.type,
        FileProcessingErrorCode.EMPTY_CONTENT
      );
    }
  }

  /**
   * Process PDF file and extract text
   */
  async processPDF(file: File): Promise<string> {
    try {
      const pdfParse = await getPdfParse();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const data = await pdfParse(buffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new FileProcessingError(
          'No text content found in PDF',
          file.type,
          FileProcessingErrorCode.EMPTY_CONTENT
        );
      }

      return data.text;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      throw new FileProcessingError(
        'Failed to extract text from PDF',
        file.type,
        FileProcessingErrorCode.EXTRACTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Process DOCX file and extract text
   */
  async processDOCX(file: File): Promise<string> {
    try {
      const mammoth = await getMammoth();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await mammoth.extractRawText({ buffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new FileProcessingError(
          'No text content found in DOCX',
          file.type,
          FileProcessingErrorCode.EMPTY_CONTENT
        );
      }

      return result.value;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      throw new FileProcessingError(
        'Failed to extract text from DOCX',
        file.type,
        FileProcessingErrorCode.EXTRACTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Process image file using OCR
   * Attempts to use Web Worker for better performance, falls back to main thread
   */
  async processImage(file: File): Promise<string> {
    try {
      // Try using Web Worker for OCR (better performance)
      if (typeof window !== 'undefined') {
        try {
          const { ocrWorkerManager } = await import('@/lib/workers/ocrWorker');

          // Initialize if not ready
          if (!ocrWorkerManager.isReady) {
            const initialized = await ocrWorkerManager.initialize(this.config.ocrLanguage || 'eng');
            if (!initialized) {
              throw new Error('Worker initialization failed');
            }
          }

          // Perform OCR in worker
          const result = await ocrWorkerManager.recognize(file);

          if (!result.text || result.text.trim().length === 0) {
            throw new FileProcessingError(
              'No text content found in image',
              file.type,
              FileProcessingErrorCode.EMPTY_CONTENT
            );
          }

          return result.text;
        } catch (workerError) {
          console.warn('Web Worker OCR failed, falling back to main thread:', workerError);
          // Fall through to main thread OCR
        }
      }

      // Fallback: Main thread OCR for server-side or when worker fails
      const Tesseract = await getTesseract();

      const result = await Tesseract.recognize(file, this.config.ocrLanguage || 'eng', {
        logger: () => { }, // Suppress logs
      });

      if (!result.data.text || result.data.text.trim().length === 0) {
        throw new FileProcessingError(
          'No text content found in image',
          file.type,
          FileProcessingErrorCode.EMPTY_CONTENT
        );
      }

      return result.data.text;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      throw new FileProcessingError(
        'Failed to extract text from image using OCR',
        file.type,
        FileProcessingErrorCode.OCR_FAILED,
        error as Error
      );
    }
  }

  /**
   * Process plain text file
   */
  async processText(file: File): Promise<string> {
    try {
      const text = await file.text();

      if (!text || text.trim().length === 0) {
        throw new FileProcessingError(
          'Text file is empty',
          file.type,
          FileProcessingErrorCode.EMPTY_CONTENT
        );
      }

      return text;
    } catch (error) {
      if (error instanceof FileProcessingError) {
        throw error;
      }
      throw new FileProcessingError(
        'Failed to read text file',
        file.type,
        FileProcessingErrorCode.EXTRACTION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Process file based on its type
   */
  async processFile(file: File): Promise<ExtractedContent> {
    // Validate file first
    await this.validateFile(file);

    let text: string;

    // Process based on file type
    if (file.type === 'application/pdf') {
      text = await this.processPDF(file);
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await this.processDOCX(file);
    } else if (file.type.startsWith('image/')) {
      text = await this.processImage(file);
    } else if (file.type === 'text/plain') {
      text = await this.processText(file);
    } else {
      throw new FileProcessingError(
        `Unsupported file type: ${file.type}`,
        file.type,
        FileProcessingErrorCode.UNSUPPORTED_FORMAT
      );
    }

    return {
      text,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedAt: new Date(),
      },
    };
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessor();
