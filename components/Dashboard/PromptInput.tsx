'use client';

/**
 * PromptInput component for AI content generation
 * Allows users to enter prompts with character limit and validation
 */

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { validatePrompt, sanitizeText } from '@/lib/utils/validation';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  uploadedContent: string | null;
  isGenerating: boolean;
  disabled?: boolean;
}

const MAX_PROMPT_LENGTH = 5000;

export default function PromptInput({
  onSubmit,
  uploadedContent,
  isGenerating,
  disabled = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remainingChars = MAX_PROMPT_LENGTH - prompt.length;
  const isValid = prompt.trim().length > 0 && remainingChars >= 0;
  const isDisabled = disabled || isGenerating || !uploadedContent;

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Allow typing but show error if exceeds limit
    setPrompt(value);
    
    if (value.length > MAX_PROMPT_LENGTH) {
      setError(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    } else {
      setError(null);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      // Validate prompt
      const validation = validatePrompt(prompt);
      if (!validation.valid) {
        setError(validation.error || 'Invalid prompt');
        return;
      }

      if (!uploadedContent) {
        setError('Please upload a file first');
        return;
      }

      // Clear error and submit with sanitized prompt
      setError(null);
      onSubmit(validation.sanitized || prompt.trim());
    },
    [prompt, uploadedContent, onSubmit]
  );

  const handleClear = useCallback(() => {
    setPrompt('');
    setError(null);
  }, []);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="prompt-input"
            className="text-lg font-semibold text-gray-800"
          >
            Enter Your Prompt
          </label>
          {prompt && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isGenerating}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Context Display */}
        {uploadedContent && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Context loaded:</span> Content from
              uploaded file is available
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {uploadedContent.length} characters extracted
            </p>
          </div>
        )}

        {!uploadedContent && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠ Please upload a file first to provide context for AI generation
            </p>
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={handleChange}
            disabled={isDisabled}
            placeholder="Example: Generate answers for the following questions. Each answer should be approximately 200 words..."
            className={`
              w-full min-h-[200px] p-4 border rounded-lg resize-y
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-gray-300'}
            `}
            rows={8}
          />

          {/* Character Counter */}
          <div className="absolute bottom-3 right-3 text-sm">
            <span
              className={`
                ${
                  remainingChars < 0
                    ? 'text-red-600 font-semibold'
                    : remainingChars < 500
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }
              `}
            >
              {remainingChars < 0 ? (
                <>
                  <span className="text-red-600">
                    {Math.abs(remainingChars)} over limit
                  </span>
                </>
              ) : (
                <>
                  {prompt.length} / {MAX_PROMPT_LENGTH}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">✗ {error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isDisabled}
          className={`
            w-full py-3 px-6 rounded-lg font-medium text-white
            transition-all duration-200
            ${
              !isValid || isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Answers'
          )}
        </button>

        {/* Helper Text */}
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Tips for better results:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Specify word count requirements (e.g., "200 words per answer")</li>
            <li>Number your questions clearly</li>
            <li>Provide context about the assignment type</li>
            <li>Be specific about formatting preferences</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
