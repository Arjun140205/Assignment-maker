'use client';

/**
 * UnifiedInput - ChatGPT-style input with file attachment
 * Single input field with + button for file uploads
 */

import { useState, useCallback, useRef, ChangeEvent, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { validatePrompt } from '@/lib/utils/validation';
import { ExtractedContent, UploadProgress, UploadStage } from '@/lib/types/file-processing';

interface UnifiedInputProps {
  onSubmit: (prompt: string) => void;
  onFileUpload: (content: ExtractedContent) => void;
  onError?: (error: string) => void;
  uploadedContent: string | null;
  isGenerating: boolean;
}

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800', 10);
const MAX_PROMPT_LENGTH = 5000;

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'text/plain': ['.txt'],
};

export default function UnifiedInput({
  onSubmit,
  onFileUpload,
  onError,
  uploadedContent,
  isGenerating,
}: UnifiedInputProps) {
  const [prompt, setPrompt] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFileName(file.name);

    try {
      setUploadProgress({
        fileName: file.name,
        progress: 10,
        stage: UploadStage.VALIDATING,
      });

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

      setUploadProgress({
        fileName: file.name,
        progress: 60,
        stage: UploadStage.PROCESSING,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to process file');
      }

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        stage: UploadStage.COMPLETE,
      });

      onFileUpload(result.content);

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

      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      
      if (onError) {
        onError(errorMessage);
      }

      setTimeout(() => {
        setUploadProgress(null);
        setIsProcessing(false);
        setUploadedFileName(null);
      }, 3000);
      
      return;
    }

    setIsProcessing(false);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        let errorMessage = 'File rejected';

        if (rejection.errors) {
          const error = rejection.errors[0];
          if (error.code === 'file-too-large') {
            errorMessage = `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
          } else if (error.code === 'file-invalid-type') {
            errorMessage = 'Invalid file type. Please upload PDF, DOCX, images, or text files';
          } else {
            errorMessage = error.message;
          }
        }

        if (onError) {
          onError(errorMessage);
        }
        return;
      }

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
    noClick: true,
    noKeyboard: true,
  });

  const handlePromptChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      const validation = validatePrompt(prompt);
      if (!validation.valid) {
        if (onError) {
          onError(validation.error || 'Invalid prompt');
        }
        return;
      }

      // If no file is uploaded, use the prompt text as context
      if (!uploadedContent) {
        // Create a virtual "uploaded content" from the prompt
        const promptContent: ExtractedContent = {
          text: prompt.trim(),
          metadata: {
            fileName: 'Direct input',
            fileType: 'text/plain',
            fileSize: prompt.trim().length,
            pageCount: 1,
            extractedAt: new Date(),
          },
        };
        onFileUpload(promptContent);
      }

      onSubmit(validation.sanitized || prompt.trim());
      setPrompt('');
    },
    [prompt, uploadedContent, onSubmit, onError, onFileUpload]
  );

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const remainingChars = MAX_PROMPT_LENGTH - prompt.length;
  const isValid = prompt.trim().length > 0 && remainingChars >= 0;
  const canSubmit = isValid && !isGenerating && !isProcessing;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* File Upload Progress */}
        {uploadProgress && (
          <div className="mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
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
          </div>
        )}

        {/* Attached File Display */}
        {uploadedFileName && !uploadProgress && (
          <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-green-800 truncate max-w-[300px]">
                {uploadedFileName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Input Area */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 rounded-2xl transition-all
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
          `}
        >
          {/* Drag Overlay */}
          {isDragActive && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-blue-600">Drop file here</p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 p-3">
            {/* Attach Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isProcessing}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file (PDF, DOCX, images)"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input {...getInputProps()} />

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                disabled={isGenerating || isProcessing}
                placeholder="Enter your prompt or questions here... (Press Enter to send, Shift+Enter for new line)"
                className="w-full max-h-[200px] p-2 pr-16 resize-none focus:outline-none text-gray-900 placeholder-gray-500 disabled:opacity-50"
                rows={1}
                style={{
                  minHeight: '40px',
                  height: 'auto',
                }}
              />
              
              {/* Character Counter */}
              {prompt.length > 0 && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {remainingChars < 0 ? (
                    <span className="text-red-600 font-semibold">
                      {Math.abs(remainingChars)} over
                    </span>
                  ) : (
                    <span>{prompt.length}</span>
                  )}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all
                ${
                  canSubmit
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Send message"
            >
              {isGenerating ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="mt-2 text-xs text-center text-gray-600">
          {uploadedContent ? (
            <>✓ File attached • Type your prompt and press Enter</>
          ) : (
            <>💡 Type your questions directly or click + to attach a file (PDF, DOCX, images)</>
          )}
        </p>
      </form>
    </div>
  );
}

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
