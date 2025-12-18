/**
 * API route for file upload and processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileProcessor } from '@/lib/services/fileProcessor';
import {
  FileProcessingError,
  FileProcessingErrorCode,
} from '@/lib/types/file-processing';
import { checkRateLimit } from '@/lib/utils/rateLimit';

/**
 * POST handler for file upload
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitCheck = checkRateLimit(request, 'upload');
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response;
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No file provided',
            code: FileProcessingErrorCode.INVALID_FILE_TYPE,
          },
        },
        { status: 400 }
      );
    }

    // Process the file
    const extractedContent = await fileProcessor.processFile(file);

    return NextResponse.json(
      {
        success: true,
        content: extractedContent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('File processing error:', error);

    // Handle FileProcessingError
    if (error instanceof FileProcessingError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            fileType: error.fileType,
          },
        },
        { status: statusCode }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred while processing the file',
          code: FileProcessingErrorCode.EXTRACTION_FAILED,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get appropriate HTTP status code for error type
 */
function getStatusCodeForError(code: FileProcessingErrorCode): number {
  switch (code) {
    case FileProcessingErrorCode.INVALID_FILE_TYPE:
    case FileProcessingErrorCode.FILE_TOO_LARGE:
    case FileProcessingErrorCode.EMPTY_CONTENT:
      return 400;
    case FileProcessingErrorCode.CORRUPTED_FILE:
    case FileProcessingErrorCode.UNSUPPORTED_FORMAT:
      return 422;
    case FileProcessingErrorCode.EXTRACTION_FAILED:
    case FileProcessingErrorCode.OCR_FAILED:
      return 500;
    default:
      return 500;
  }
}

/**
 * GET handler - return supported file types and configuration
 */
export async function GET() {
  return NextResponse.json({
    supportedTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain',
    ],
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800', 10),
    maxFileSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800', 10) / 1024 / 1024,
  });
}
