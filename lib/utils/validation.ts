/**
 * Validation utilities for input sanitization and validation
 */

import {
  FileProcessingError,
  FileProcessingErrorCode,
} from '@/lib/types/file-processing';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

/**
 * Default file validation config
 */
const DEFAULT_FILE_CONFIG: FileValidationConfig = {
  maxSize: 52428800, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
  ],
  allowedExtensions: ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.txt'],
};

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  config: Partial<FileValidationConfig> = {}
): ValidationResult {
  const finalConfig = { ...DEFAULT_FILE_CONFIG, ...config };

  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  // Validate file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  if (file.size > finalConfig.maxSize) {
    const maxSizeMB = (finalConfig.maxSize / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Validate file type
  if (!finalConfig.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Allowed types: PDF, DOCX, PNG, JPG, TXT`,
    };
  }

  // Validate file extension
  const extension = getFileExtension(file.name);
  if (!finalConfig.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension "${extension}" is not allowed`,
    };
  }

  // Validate file name (prevent path traversal)
  if (!isValidFileName(file.name)) {
    return {
      valid: false,
      error: 'Invalid file name',
    };
  }

  return {
    valid: true,
    sanitized: file,
  };
}

/**
 * Validate prompt input
 */
export function validatePrompt(prompt: string): ValidationResult {
  // Check if prompt exists
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt is required',
    };
  }

  // Trim whitespace
  const trimmed = prompt.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty',
    };
  }

  // Check length
  if (trimmed.length > 5000) {
    return {
      valid: false,
      error: 'Prompt must be 5000 characters or less',
    };
  }

  // Check for minimum length
  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Prompt must be at least 10 characters',
    };
  }

  // Sanitize HTML/XSS
  const sanitized = sanitizeText(trimmed);

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate context text
 */
export function validateContext(context: string): ValidationResult {
  // Check if context exists
  if (!context || typeof context !== 'string') {
    return {
      valid: false,
      error: 'Context is required',
    };
  }

  // Trim whitespace
  const trimmed = context.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Context cannot be empty. Please upload a file first.',
    };
  }

  // Check maximum length (100MB of text)
  if (trimmed.length > 100000000) {
    return {
      valid: false,
      error: 'Context is too large',
    };
  }

  // Sanitize HTML/XSS
  const sanitized = sanitizeText(trimmed);

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate word count
 */
export function validateWordCount(wordCount: any): ValidationResult {
  // Allow undefined
  if (wordCount === undefined || wordCount === null) {
    return {
      valid: true,
      sanitized: undefined,
    };
  }

  // Check if number
  if (typeof wordCount !== 'number') {
    return {
      valid: false,
      error: 'Word count must be a number',
    };
  }

  // Check if positive
  if (wordCount <= 0) {
    return {
      valid: false,
      error: 'Word count must be positive',
    };
  }

  // Check reasonable range
  if (wordCount > 10000) {
    return {
      valid: false,
      error: 'Word count must be 10,000 or less',
    };
  }

  return {
    valid: true,
    sanitized: Math.floor(wordCount),
  };
}

/**
 * Validate question count
 */
export function validateQuestionCount(questionCount: any): ValidationResult {
  // Allow undefined
  if (questionCount === undefined || questionCount === null) {
    return {
      valid: true,
      sanitized: undefined,
    };
  }

  // Check if number
  if (typeof questionCount !== 'number') {
    return {
      valid: false,
      error: 'Question count must be a number',
    };
  }

  // Check if positive integer
  if (questionCount <= 0 || !Number.isInteger(questionCount)) {
    return {
      valid: false,
      error: 'Question count must be a positive integer',
    };
  }

  // Check reasonable range
  if (questionCount > 100) {
    return {
      valid: false,
      error: 'Question count must be 100 or less',
    };
  }

  return {
    valid: true,
    sanitized: questionCount,
  };
}

/**
 * Validate API response structure
 */
export function validateAPIResponse(response: any, expectedFields: string[]): ValidationResult {
  // Check if response exists
  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      error: 'Invalid API response',
    };
  }

  // Check for required fields
  for (const field of expectedFields) {
    if (!(field in response)) {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  return {
    valid: true,
    sanitized: response,
  };
}

/**
 * Validate color hex code
 */
export function validateColor(color: string): ValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      valid: false,
      error: 'Color is required',
    };
  }

  // Check hex format
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexPattern.test(color)) {
    return {
      valid: false,
      error: 'Invalid color format. Use hex format (e.g., #000000)',
    };
  }

  return {
    valid: true,
    sanitized: color.toUpperCase(),
  };
}

/**
 * Validate font ID
 */
export function validateFontId(fontId: string): ValidationResult {
  if (!fontId || typeof fontId !== 'string') {
    return {
      valid: false,
      error: 'Font ID is required',
    };
  }

  // Sanitize to prevent injection
  const sanitized = fontId.replace(/[^a-zA-Z0-9-_]/g, '');

  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Invalid font ID',
    };
  }

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate page style
 */
export function validatePageStyle(style: string): ValidationResult {
  const validStyles = ['ruled', 'unruled', 'lined'];

  if (!style || typeof style !== 'string') {
    return {
      valid: false,
      error: 'Page style is required',
    };
  }

  if (!validStyles.includes(style)) {
    return {
      valid: false,
      error: `Invalid page style. Must be one of: ${validStyles.join(', ')}`,
    };
  }

  return {
    valid: true,
    sanitized: style,
  };
}

/**
 * Sanitize text to prevent XSS
 * Uses a simple but effective approach for Next.js compatibility
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous characters
  let sanitized = text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '')
    // Decode HTML entities to prevent double encoding attacks
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');

  // Remove any remaining HTML tags after entity decoding
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized.trim();
}

/**
 * Sanitize HTML (allow some safe tags)
 * For cases where we need to preserve some formatting
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // List of allowed tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'span'];
  
  // Remove all tags except allowed ones
  let sanitized = html;
  
  // First, remove dangerous content
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');

  // Remove all tags except allowed ones
  sanitized = sanitized.replace(/<(\/?)([\w]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (allowedTags.includes(lowerTag)) {
      // For allowed tags, only keep class attribute
      if (attrs && attrs.includes('class=')) {
        const classMatch = attrs.match(/class=["']([^"']*)["']/);
        if (classMatch) {
          return `<${slash}${lowerTag} class="${classMatch[1]}">`;
        }
      }
      return `<${slash}${lowerTag}>`;
    }
    return ''; // Remove disallowed tags
  });

  return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL is required',
    };
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.',
      };
    }

    return {
      valid: true,
      sanitized: parsed.toString(),
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return {
    valid: true,
    sanitized: email.toLowerCase().trim(),
  };
}

/**
 * Helper: Get file extension
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * Helper: Validate file name (prevent path traversal)
 */
function isValidFileName(fileName: string): boolean {
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }

  // Check for null bytes
  if (fileName.includes('\0')) {
    return false;
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(fileName)) {
    return false;
  }

  return true;
}

/**
 * Batch validation helper
 */
export function validateAll(
  validations: Array<() => ValidationResult>
): ValidationResult {
  for (const validate of validations) {
    const result = validate();
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Create validation error
 */
export function createValidationError(message: string): Error {
  const error = new Error(message);
  error.name = 'ValidationError';
  return error;
}
