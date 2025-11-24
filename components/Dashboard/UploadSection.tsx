'use client';

/**
 * UploadSection component with drag-and-drop functionality
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ExtractedContent,
  FileProcessingErrorCode,
  UploadProgress,
  UploadStage,
} from '@/lib/types/file-processing';

interface UploadSectionProps {
  onFileUpload: (content: ExtractedContent) => void;
  onError?: (error: string) => void;
}

const MAX_FILE_SIZE = parseInt(
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800',
  10
); // 50MB

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/plain': ['.txt'],
};

export default function UploadSection({
  onFileUpload,
  onError,
}: UploadSectionProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file.name);

    try {
      // Validation stage
      setUploadProgress({
        fileName: file.name,
        progress: 10,
        stage: UploadStage.VALIDATING,
      });

      // Upload stage
      setUploadProgress({
        fileName: file.name,
        progress: 30,
        stage: UploadStage.UPLOADING,
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Processing stage
      setUploadProgress({
        fileName: file.name,
        progress: 60,
        stage: UploadStage.PROCESSING,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message || 'Failed to process file'
        );
      }

      // Extraction complete
      setUploadProgress({
        fileName: file.name,
        progress: 100,
        stage: UploadStage.COMPLETE,
      });

      // Call success callback
      onFileUpload(result.content);

      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        stage: UploadStage.ERROR,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload file';
      
      if (onError) {
        onError(errorMessage);
      }

      // Clear error state after delay
      setTimeout(() => {
        setUploadProgress(null);
        setIsProcessing(false);
      }, 3000);
      
      return;
    }

    setIsProcessing(false);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        let errorMessage = 'File rejected';

        if (rejection.errors) {
          const error = rejection.errors[0];
          if (error.code === 'file-too-large') {
            errorMessage = `File is too large. Maximum size is ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB`;
          } else if (error.code === 'file-invalid-type') {
            errorMessage =
              'Invalid file type. Please upload PDF, DOCX, images, or text files';
          } else {
            errorMessage = error.message;
          }
        }

        if (onError) {
          onError(errorMessage);
        }
        return;
      }

      // Process the first accepted file
      if (acceptedFiles.length > 0) {
        await processFile(acceptedFiles[0]);
      }
    },
    [onFileUpload, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isProcessing,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {/* Upload Icon */}
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {/* Upload Text */}
          <div>
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                Drop the file here
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  {isProcessing
                    ? 'Processing file...'
                    : 'Drag & drop a file here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, DOCX, images (PNG, JPG), and text files
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {uploadProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress.fileName}
            </span>
            <span className="text-sm text-gray-500">
              {getStageLabel(uploadProgress.stage)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadProgress.stage === UploadStage.ERROR
                  ? 'bg-red-500'
                  : uploadProgress.stage === UploadStage.COMPLETE
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>

          {uploadProgress.stage === UploadStage.COMPLETE && (
            <p className="text-sm text-green-600 mt-2">
              ✓ File processed successfully
            </p>
          )}
          
          {uploadProgress.stage === UploadStage.ERROR && (
            <p className="text-sm text-red-600 mt-2">
              ✗ Failed to process file
            </p>
          )}
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && !uploadProgress && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ <span className="font-medium">{uploadedFile}</span> uploaded
            successfully
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get human-readable label for upload stage
 */
function getStageLabel(stage: UploadStage): string {
  switch (stage) {
    case UploadStage.VALIDATING:
      return 'Validating...';
    case UploadStage.UPLOADING:
      return 'Uploading...';
    case UploadStage.PROCESSING:
      return 'Processing...';
    case UploadStage.EXTRACTING:
      return 'Extracting text...';
    case UploadStage.COMPLETE:
      return 'Complete';
    case UploadStage.ERROR:
      return 'Error';
    default:
      return '';
  }
}
