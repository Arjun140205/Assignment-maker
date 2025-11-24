/**
 * Type definitions for file processing system
 */

/**
 * Extracted content from uploaded files
 */
export interface ExtractedContent {
  text: string;
  metadata: FileMetadata;
}

/**
 * Metadata about the uploaded file
 */
export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  pageCount?: number;
  extractedAt: Date;
}

/**
 * Supported file types for upload
 */
export type SupportedFileType = 'pdf' | 'docx' | 'image' | 'text';

/**
 * File processing result
 */
export interface FileProcessingResult {
  success: boolean;
  content?: ExtractedContent;
  error?: FileProcessingError;
}

/**
 * Custom error class for file processing failures
 */
export class FileProcessingError extends Error {
  constructor(
    message: string,
    public fileType: string,
    public code: FileProcessingErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FileProcessingError';
    Object.setPrototypeOf(this, FileProcessingError.prototype);
  }
}

/**
 * Error codes for file processing
 */
export enum FileProcessingErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  OCR_FAILED = 'OCR_FAILED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  EMPTY_CONTENT = 'EMPTY_CONTENT',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * File processor interface
 */
export interface IFileProcessor {
  processPDF(file: File): Promise<string>;
  processDOCX(file: File): Promise<string>;
  processImage(file: File): Promise<string>;
  processText(file: File): Promise<string>;
  validateFile(file: File): Promise<void>;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  stage: UploadStage;
}

/**
 * Stages of file upload and processing
 */
export enum UploadStage {
  VALIDATING = 'VALIDATING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  EXTRACTING = 'EXTRACTING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: FileProcessingErrorCode;
}

/**
 * Configuration for file processing
 */
export interface FileProcessingConfig {
  maxFileSize: number;
  supportedTypes: string[];
  ocrLanguage?: string;
}
