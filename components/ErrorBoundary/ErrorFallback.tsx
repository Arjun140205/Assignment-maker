'use client';

/**
 * Reusable error fallback components for different error scenarios
 */

import React from 'react';
import {
  FileProcessingError,
  FileProcessingErrorCode,
} from '@/lib/types/file-processing';
import {
  AIGenerationError,
  AIGenerationErrorCode,
} from '@/lib/types/ai-service';
import {
  ExportError,
  ExportErrorCode,
  RenderingError,
  RenderingErrorCode,
} from '@/lib/types/canvas';

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  title?: string;
}

/**
 * Generic error fallback component
 */
export function ErrorFallback({
  error,
  resetError,
  title = 'An Error Occurred',
}: ErrorFallbackProps): React.ReactElement {
  const errorDetails = getErrorDetails(error);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorDetails.message}</p>
            {errorDetails.suggestion && (
              <p className="mt-2 font-medium">{errorDetails.suggestion}</p>
            )}
          </div>
          {resetError && (
            <div className="mt-4">
              <button
                onClick={resetError}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * File processing error fallback
 */
export function FileProcessingErrorFallback({
  error,
  resetError,
}: {
  error: FileProcessingError;
  resetError?: () => void;
}): React.ReactElement {
  const details = getFileProcessingErrorDetails(error);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            File Processing Error
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>{details.message}</p>
            {details.suggestion && (
              <p className="mt-2 font-medium">{details.suggestion}</p>
            )}
          </div>
          {resetError && (
            <div className="mt-4">
              <button
                onClick={resetError}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AI generation error fallback
 */
export function AIGenerationErrorFallback({
  error,
  resetError,
}: {
  error: AIGenerationError;
  resetError?: () => void;
}): React.ReactElement {
  const details = getAIGenerationErrorDetails(error);

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-purple-800">
            AI Generation Error
          </h3>
          <div className="mt-2 text-sm text-purple-700">
            <p>{details.message}</p>
            {details.suggestion && (
              <p className="mt-2 font-medium">{details.suggestion}</p>
            )}
            {error.retryable && (
              <p className="mt-2 text-xs">This error is temporary and can be retried.</p>
            )}
          </div>
          {resetError && error.retryable && (
            <div className="mt-4">
              <button
                onClick={resetError}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                Retry Generation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Export error fallback
 */
export function ExportErrorFallback({
  error,
  resetError,
}: {
  error: ExportError;
  resetError?: () => void;
}): React.ReactElement {
  const details = getExportErrorDetails(error);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Export Error</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>{details.message}</p>
            {details.suggestion && (
              <p className="mt-2 font-medium">{details.suggestion}</p>
            )}
          </div>
          {resetError && (
            <div className="mt-4">
              <button
                onClick={resetError}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Try Export Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Rendering error fallback
 */
export function RenderingErrorFallback({
  error,
  resetError,
}: {
  error: RenderingError;
  resetError?: () => void;
}): React.ReactElement {
  const details = getRenderingErrorDetails(error);

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Rendering Error
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>{details.message}</p>
            {error.pageNumber > 0 && (
              <p className="mt-1 text-xs">Error occurred on page {error.pageNumber}</p>
            )}
            {details.suggestion && (
              <p className="mt-2 font-medium">{details.suggestion}</p>
            )}
          </div>
          {resetError && (
            <div className="mt-4">
              <button
                onClick={resetError}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
              >
                Retry Rendering
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper functions to get error details and suggestions
 */

interface ErrorDetails {
  message: string;
  suggestion?: string;
}

function getErrorDetails(error: Error): ErrorDetails {
  if (error instanceof FileProcessingError) {
    return getFileProcessingErrorDetails(error);
  }
  if (error instanceof AIGenerationError) {
    return getAIGenerationErrorDetails(error);
  }
  if (error instanceof ExportError) {
    return getExportErrorDetails(error);
  }
  if (error instanceof RenderingError) {
    return getRenderingErrorDetails(error);
  }

  return {
    message: error.message || 'An unexpected error occurred',
    suggestion: 'Please try again or refresh the page.',
  };
}

function getFileProcessingErrorDetails(error: FileProcessingError): ErrorDetails {
  switch (error.code) {
    case FileProcessingErrorCode.INVALID_FILE_TYPE:
      return {
        message: 'The file type is not supported.',
        suggestion: 'Please upload a PDF, DOCX, image (PNG/JPG), or text file.',
      };
    case FileProcessingErrorCode.FILE_TOO_LARGE:
      return {
        message: 'The file is too large.',
        suggestion: 'Please upload a file smaller than 50MB.',
      };
    case FileProcessingErrorCode.EMPTY_CONTENT:
      return {
        message: 'No text content was found in the file.',
        suggestion: 'Please ensure the file contains readable text.',
      };
    case FileProcessingErrorCode.CORRUPTED_FILE:
      return {
        message: 'The file appears to be corrupted.',
        suggestion: 'Please try uploading a different file.',
      };
    case FileProcessingErrorCode.OCR_FAILED:
      return {
        message: 'Failed to extract text from the image.',
        suggestion: 'Please ensure the image contains clear, readable text.',
      };
    default:
      return {
        message: error.message,
        suggestion: 'Please try uploading a different file.',
      };
  }
}

function getAIGenerationErrorDetails(error: AIGenerationError): ErrorDetails {
  switch (error.code) {
    case AIGenerationErrorCode.INVALID_API_KEY:
      return {
        message: `Invalid API key for ${error.provider}.`,
        suggestion: 'Please check your API configuration.',
      };
    case AIGenerationErrorCode.RATE_LIMIT_EXCEEDED:
      return {
        message: 'Rate limit exceeded.',
        suggestion: 'Please wait a moment and try again.',
      };
    case AIGenerationErrorCode.INSUFFICIENT_QUOTA:
      return {
        message: 'Insufficient API quota.',
        suggestion: 'Please check your account balance.',
      };
    case AIGenerationErrorCode.TIMEOUT:
      return {
        message: 'Request timed out.',
        suggestion: 'Please try again with a shorter prompt or context.',
      };
    case AIGenerationErrorCode.NETWORK_ERROR:
      return {
        message: 'Network error occurred.',
        suggestion: 'Please check your internet connection and try again.',
      };
    default:
      return {
        message: error.message,
        suggestion: 'Please try again.',
      };
  }
}

function getExportErrorDetails(error: ExportError): ErrorDetails {
  switch (error.code) {
    case ExportErrorCode.INVALID_OPTIONS:
      return {
        message: 'Invalid export options.',
        suggestion: 'Please check your export settings and try again.',
      };
    case ExportErrorCode.RENDERING_FAILED:
      return {
        message: 'Failed to render pages for export.',
        suggestion: 'Please try reducing the document size or quality.',
      };
    case ExportErrorCode.PDF_GENERATION_FAILED:
      return {
        message: 'Failed to generate PDF.',
        suggestion: 'Please try again or reduce the number of pages.',
      };
    case ExportErrorCode.DOWNLOAD_FAILED:
      return {
        message: 'Failed to download the PDF.',
        suggestion: 'Please check your browser settings and try again.',
      };
    case ExportErrorCode.MEMORY_EXCEEDED:
      return {
        message: 'Memory limit exceeded.',
        suggestion: 'Please try exporting fewer pages at a time.',
      };
    default:
      return {
        message: error.message,
        suggestion: 'Please try again.',
      };
  }
}

function getRenderingErrorDetails(error: RenderingError): ErrorDetails {
  switch (error.code) {
    case RenderingErrorCode.CANVAS_CONTEXT_LOST:
      return {
        message: 'Canvas context was lost.',
        suggestion: 'Please refresh the page and try again.',
      };
    case RenderingErrorCode.FONT_LOAD_FAILED:
      return {
        message: 'Failed to load the selected font.',
        suggestion: 'Please try selecting a different font.',
      };
    case RenderingErrorCode.INVALID_PAGE_DATA:
      return {
        message: 'Invalid page data.',
        suggestion: 'Please regenerate the content.',
      };
    case RenderingErrorCode.MEMORY_ERROR:
      return {
        message: 'Memory error during rendering.',
        suggestion: 'Please try reducing the amount of content.',
      };
    default:
      return {
        message: error.message,
        suggestion: 'Please try again.',
      };
  }
}
