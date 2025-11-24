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
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');

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

  const handlePastedTextSubmit = () => {
    if (!pastedText.trim()) {
      if (onError) {
        onError('Please enter some text');
      }
      return;
    }

    const content: ExtractedContent = {
      text: pastedText.trim(),
      metadata: {
        fileName: 'Pasted text',
        fileType: 'text/plain',
        fileSize: pastedText.trim().length,
        pageCount: 1,
        extractedAt: new Date(),
      },
    };

    onFileUpload(content);
    setUploadedFile('Pasted text');
  };

  return (
    <div className="w-full">
      {/* Mode Toggle - Compact */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInputMode('upload')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'upload'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📎 Upload File
        </button>
        <button
          onClick={() => setInputMode('paste')}
          className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'paste'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📝 Paste Text
        </button>
      </div>

      {inputMode === 'upload' ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
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
          
          <div className="flex items-center justify-center gap-3">
            {/* Upload Icon */}
            <svg
              className="w-8 h-8 text-gray-400"
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
            <div className="text-left">
              {isDragActive ? (
                <p className="text-sm font-medium text-blue-600">
                  Drop the file here
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {isProcessing
                      ? 'Processing file...'
                      : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    PDF, DOCX, images, or text files (max {MAX_FILE_SIZE / 1024 / 1024}MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your assignment questions here..."
            className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 transition-colors text-gray-900"
          />
          <button
            onClick={handlePastedTextSubmit}
            disabled={!pastedText.trim()}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Use This Text
          </button>
        </div>
      )}

      {/* Progress Indicator - Compact */}
      {uploadProgress && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-900 truncate max-w-[70%]">
              {uploadProgress.fileName}
            </span>
            <span className="text-xs text-gray-600">
              {getStageLabel(uploadProgress.stage)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
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
            <p className="text-xs text-green-600 mt-1">
              ✓ File processed successfully
            </p>
          )}
          
          {uploadProgress.stage === UploadStage.ERROR && (
            <p className="text-xs text-red-600 mt-1">
              ✗ Failed to process file
            </p>
          )}
        </div>
      )}

      {/* Uploaded File Info - Compact */}
      {uploadedFile && !uploadProgress && (
        <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">
            ✓ <span className="font-medium">{uploadedFile}</span> uploaded
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
