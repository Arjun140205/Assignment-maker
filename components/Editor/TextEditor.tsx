'use client';

/**
 * TextEditor component with real-time editing capabilities
 * Displays generated answers with contenteditable divs for editing
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Answer } from '@/lib/types';
import { sanitizeText } from '@/lib/utils/validation';

interface TextEditorProps {
  answers: Answer[];
  onEdit: (answerId: number, content: string) => void;
  readOnly?: boolean;
  editedAnswers?: Map<number, string>;
}

const DEBOUNCE_DELAY = 300; // 300ms debounce delay

const TextEditor = React.memo(function TextEditor({
  answers,
  onEdit,
  readOnly = false,
  editedAnswers = new Map(),
}: TextEditorProps) {
  const [localEdits, setLocalEdits] = useState<Map<number, string>>(new Map());
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  /**
   * Get the current content for an answer (edited or original)
   */
  const getAnswerContent = useCallback(
    (answer: Answer): string => {
      // Check local edits first
      if (localEdits.has(answer.questionNumber)) {
        return localEdits.get(answer.questionNumber)!;
      }
      // Then check edited answers from parent
      if (editedAnswers.has(answer.questionNumber)) {
        return editedAnswers.get(answer.questionNumber)!;
      }
      // Fall back to original content
      return answer.content;
    },
    [localEdits, editedAnswers]
  );

  /**
   * Check if an answer has been edited
   */
  const isEdited = useCallback(
    (answer: Answer): boolean => {
      return (
        localEdits.has(answer.questionNumber) ||
        editedAnswers.has(answer.questionNumber)
      );
    },
    [localEdits, editedAnswers]
  );

  /**
   * Handle content change with debouncing
   */
  const handleContentChange = useCallback(
    (answerId: number, newContent: string) => {
      // Update local state immediately for responsive UI
      setLocalEdits((prev) => {
        const updated = new Map(prev);
        updated.set(answerId, newContent);
        return updated;
      });

      // Clear existing timer for this answer
      const existingTimer = debounceTimers.current.get(answerId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounced timer
      const timer = setTimeout(() => {
        onEdit(answerId, newContent);
        debounceTimers.current.delete(answerId);
      }, DEBOUNCE_DELAY);

      debounceTimers.current.set(answerId, timer);
    },
    [onEdit]
  );

  /**
   * Handle input event from contenteditable div
   */
  const handleInput = useCallback(
    (answerId: number, event: React.FormEvent<HTMLDivElement>) => {
      const rawContent = event.currentTarget.textContent || '';
      // Sanitize content to prevent XSS
      const sanitized = sanitizeText(rawContent);
      handleContentChange(answerId, sanitized);
    },
    [handleContentChange]
  );

  /**
   * Handle paste event to strip formatting and sanitize
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      // Sanitize pasted content
      const sanitized = sanitizeText(text);
      document.execCommand('insertText', false, sanitized);
    },
    []
  );

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  if (answers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No content yet</p>
          <p className="text-sm mt-2">
            Upload a file and generate answers to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {answers.map((answer) => {
        const content = getAnswerContent(answer);
        const edited = isEdited(answer);

        return (
          <div
            key={answer.questionNumber}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            {/* Answer Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Question {answer.questionNumber}
                </span>
                {edited && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Edited
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {content.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {/* Editable Content */}
            <div
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onInput={(e) => handleInput(answer.questionNumber, e)}
              onPaste={handlePaste}
              className={`
                min-h-[100px] p-3 rounded border
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  readOnly
                    ? 'bg-gray-50 cursor-not-allowed'
                    : 'bg-white cursor-text'
                }
                ${edited ? 'border-blue-300' : 'border-gray-200'}
                text-gray-800 leading-relaxed
              `}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content}
            </div>

            {/* Footer Info */}
            <div className="mt-2 text-xs text-gray-400">
              {readOnly ? (
                <span>Read-only mode</span>
              ) : (
                <span>Click to edit • Changes save automatically</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default TextEditor;
