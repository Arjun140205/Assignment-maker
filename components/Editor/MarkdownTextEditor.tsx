'use client';

/**
 * MarkdownTextEditor with markdown preview support
 * WCAG compliant, mobile-first responsive
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Answer } from '@/lib/types';
import { sanitizeText } from '@/lib/utils/validation';

interface MarkdownTextEditorProps {
  answers: Answer[];
  onEdit: (answerId: number, content: string) => void;
  readOnly?: boolean;
  editedAnswers?: Map<number, string>;
}

const DEBOUNCE_DELAY = 300;

const MarkdownTextEditor = React.memo(function MarkdownTextEditor({
  answers,
  onEdit,
  readOnly = false,
  editedAnswers = new Map(),
}: MarkdownTextEditorProps) {
  const [localEdits, setLocalEdits] = useState<Map<number, string>>(new Map());
  const [previewMode, setPreviewMode] = useState<Map<number, boolean>>(new Map());
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const getAnswerContent = useCallback(
    (answer: Answer): string => {
      if (localEdits.has(answer.questionNumber)) {
        return localEdits.get(answer.questionNumber)!;
      }
      if (editedAnswers.has(answer.questionNumber)) {
        return editedAnswers.get(answer.questionNumber)!;
      }
      return answer.content;
    },
    [localEdits, editedAnswers]
  );

  const isEdited = useCallback(
    (answer: Answer): boolean => {
      return (
        localEdits.has(answer.questionNumber) ||
        editedAnswers.has(answer.questionNumber)
      );
    },
    [localEdits, editedAnswers]
  );

  const handleContentChange = useCallback(
    (answerId: number, newContent: string) => {
      setLocalEdits((prev) => {
        const updated = new Map(prev);
        updated.set(answerId, newContent);
        return updated;
      });

      const existingTimer = debounceTimers.current.get(answerId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        onEdit(answerId, newContent);
        debounceTimers.current.delete(answerId);
      }, DEBOUNCE_DELAY);

      debounceTimers.current.set(answerId, timer);
    },
    [onEdit]
  );

  const handleInput = useCallback(
    (answerId: number, event: React.FormEvent<HTMLDivElement>) => {
      const rawContent = event.currentTarget.textContent || '';
      const sanitized = sanitizeText(rawContent);
      handleContentChange(answerId, sanitized);
    },
    [handleContentChange]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const sanitized = sanitizeText(text);
      document.execCommand('insertText', false, sanitized);
    },
    []
  );

  const togglePreview = useCallback((answerId: number) => {
    setPreviewMode((prev) => {
      const updated = new Map(prev);
      updated.set(answerId, !prev.get(answerId));
      return updated;
    });
  }, []);

  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  if (answers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] animate-fade-in">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">No content yet</p>
          <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
            Upload a file and generate answers to see them here. You can edit and format with markdown!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {answers.map((answer) => {
        const content = getAnswerContent(answer);
        const edited = isEdited(answer);
        const isPreview = previewMode.get(answer.questionNumber) || false;

        return (
          <div
            key={answer.questionNumber}
            className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm hover:shadow-md transition-all hover-lift animate-fade-in"
          >
            {/* Answer Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b-2 border-gray-100 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  Q{answer.questionNumber}
                </span>
                {edited && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edited
                  </span>
                )}
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                  {content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              
              <button
                onClick={() => togglePreview(answer.questionNumber)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all button-press"
                aria-label={isPreview ? 'Switch to edit mode' : 'Switch to preview mode'}
              >
                {isPreview ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </>
                )}
              </button>
            </div>

            {/* Content Area */}
            {isPreview ? (
              <div className="markdown prose prose-sm sm:prose max-w-none p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={(e) => handleInput(answer.questionNumber, e)}
                onPaste={handlePaste}
                className={`
                  min-h-[120px] p-4 rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${
                    readOnly
                      ? 'bg-gray-50 cursor-not-allowed text-gray-600'
                      : 'bg-white cursor-text hover:border-blue-300'
                  }
                  ${edited ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}
                  text-gray-900 leading-relaxed text-sm sm:text-base
                `}
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                role="textbox"
                aria-label={`Answer for question ${answer.questionNumber}`}
                aria-multiline="true"
              >
                {content}
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                {readOnly ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Read-only mode
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Click to edit • Changes save automatically
                  </>
                )}
              </span>
              <span className="text-gray-400">
                Supports markdown formatting
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default MarkdownTextEditor;
