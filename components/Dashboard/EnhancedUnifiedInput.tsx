'use client';

/**
 * Enhanced UnifiedInput - Professional ChatGPT-style input
 * Mobile-first, WCAG compliant, with micro-interactions
 */

import { useState, useCallback, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { validatePrompt } from '@/lib/utils/validation';
import { ExtractedContent, UploadProgress, UploadStage } from '@/lib/types/file-processing';

interface EnhancedUnifiedInputProps {
  onSubmit: (prompt: string, directContext?: string) => void;
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

export default function EnhancedUnifiedInput({
  onSubmit,
  onFileUpload,
  onError,
  uploadedContent,
  isGenerating,
}: EnhancedUnifiedInputProps) {
  const [prompt, setPrompt] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

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

      const sanitizedPrompt = validation.sanitized || prompt.trim();

      if (!uploadedContent) {
        const promptContent: ExtractedContent = {
          text: sanitizedPrompt,
          metadata: {
            fileName: 'Direct input',
            fileType: 'text/plain',
            fileSize: sanitizedPrompt.length,
            pageCount: 1,
            extractedAt: new Date(),
          },
        };
        onFileUpload(promptContent);
        onSubmit(sanitizedPrompt, sanitizedPrompt);
      } else {
        onSubmit(sanitizedPrompt);
      }

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const remainingChars = MAX_PROMPT_LENGTH - prompt.length;
  const isValid = prompt.trim().length > 0 && remainingChars >= 0;
  const canSubmit = isValid && !isGenerating && !isProcessing;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* File Upload Progress */}
        {uploadProgress && (
          <div className="animate-fade-in px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 truncate max-w-[70%]">
                📄 {uploadProgress.fileName}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {getStageLabel(uploadProgress.stage)}
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
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
          <div className="animate-scale-in px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm flex items-center justify-between hover-lift">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">
                  {uploadedFileName}
                </p>
                <p className="text-xs text-green-600">
                  File attached successfully
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex-shrink-0 ml-3 p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all button-press"
              aria-label="Remove attached file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Input Area */}
        <div
          {...getRootProps()}
          className={`
            relative rounded-2xl transition-all duration-300 shadow-lg
            ${isDragActive ? 'ring-4 ring-blue-400 ring-opacity-50 bg-blue-50 scale-[1.02]' : ''}
            ${isFocused ? 'ring-2 ring-blue-500 shadow-xl' : 'ring-1 ring-gray-300'}
            bg-white
          `}
        >
          {/* Drag Overlay */}
          {isDragActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-95 rounded-2xl flex items-center justify-center z-10 animate-scale-in">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-blue-600">Drop file here</p>
                <p className="text-sm text-blue-500 mt-1">PDF, DOCX, or images</p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 p-3 sm:p-4">
            {/* Attach Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isProcessing}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-300 transition-all hover-lift button-press disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Attach file"
              title="Attach file (PDF, DOCX, images)"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
              onChange={handleFileSelect}
              className="sr-only"
              aria-label="File upload input"
            />
            <input {...getInputProps()} />

            {/* Text Input */}
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isGenerating || isProcessing}
                placeholder="Type your questions or prompt here... (Press Enter to send, Shift+Enter for new line)"
                className="w-full max-h-[200px] p-3 pr-16 resize-none focus:outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                rows={1}
                style={{
                  minHeight: '44px',
                }}
                aria-label="Prompt input"
                aria-describedby="char-count"
              />
              
              {/* Character Counter */}
              {prompt.length > 0 && (
                <div 
                  id="char-count"
                  className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm"
                  aria-live="polite"
                >
                  <span className={remainingChars < 0 ? 'text-red-600 font-semibold' : remainingChars < 500 ? 'text-yellow-600' : 'text-gray-500'}>
                    {remainingChars < 0 ? `${Math.abs(remainingChars)} over` : `${prompt.length}`}
                  </span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-all button-press
                ${
                  canSubmit
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover-lift'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label={isGenerating ? 'Generating...' : 'Send message'}
              title={isGenerating ? 'Generating...' : 'Send message'}
            >
              {isGenerating ? (
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-xs sm:text-sm text-center text-gray-600 px-4" role="status" aria-live="polite">
          {uploadedContent ? (
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              File attached • Type your prompt and press Enter
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              💡 Type your questions directly or click 
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              to attach a file
            </span>
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
      return 'Complete ✓';
    case UploadStage.ERROR:
      return 'Error ✗';
    default:
      return '';
  }
}
