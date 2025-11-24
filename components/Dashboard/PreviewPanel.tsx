'use client';

/**
 * PreviewPanel component with split-pane layout
 * Shows text editor on left and canvas preview on right with synchronized scrolling
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Answer, CanvasPage, HandwrittenFont, PageStyle } from '@/lib/types';
import TextEditor from '@/components/Editor/TextEditor';
import NotebookCanvas from '@/components/Canvas/NotebookCanvas';
import { useAppContext } from '@/lib/context/AppContext';

interface PreviewPanelProps {
  textContent: Answer[];
  handwrittenContent: CanvasPage[];
  onTextEdit: (answerId: number, newContent: string) => void;
  syncScroll?: boolean;
  editedAnswers?: Map<number, string>;
}

const MIN_PANE_WIDTH = 300; // Minimum width for each pane in pixels
const DEFAULT_LEFT_WIDTH = 50; // Default left pane width as percentage

export default function PreviewPanel({
  textContent,
  handwrittenContent,
  onTextEdit,
  syncScroll = true,
  editedAnswers,
}: PreviewPanelProps) {
  const { state } = useAppContext();
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  /**
   * Handle mouse down on resize handle
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = leftWidth;
  }, [leftWidth]);

  /**
   * Handle mouse move during resize
   */
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - resizeStartX.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = resizeStartWidth.current + deltaPercent;

      // Calculate min/max widths as percentages
      const minWidthPercent = (MIN_PANE_WIDTH / containerWidth) * 100;
      const maxWidthPercent = 100 - minWidthPercent;

      // Clamp the new width
      const clampedWidth = Math.max(
        minWidthPercent,
        Math.min(maxWidthPercent, newWidth)
      );

      setLeftWidth(clampedWidth);
    },
    [isResizing]
  );

  /**
   * Handle mouse up to end resize
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  /**
   * Handle synchronized scrolling between panes
   */
  const handleLeftScroll = useCallback(() => {
    if (!syncScroll || !leftPaneRef.current || !rightPaneRef.current) return;

    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;

    // Calculate scroll percentage
    const scrollPercentage =
      leftPane.scrollTop / (leftPane.scrollHeight - leftPane.clientHeight);

    // Apply to right pane
    rightPane.scrollTop =
      scrollPercentage * (rightPane.scrollHeight - rightPane.clientHeight);
  }, [syncScroll]);

  const handleRightScroll = useCallback(() => {
    if (!syncScroll || !leftPaneRef.current || !rightPaneRef.current) return;

    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;

    // Calculate scroll percentage
    const scrollPercentage =
      rightPane.scrollTop / (rightPane.scrollHeight - rightPane.clientHeight);

    // Apply to left pane
    leftPane.scrollTop =
      scrollPercentage * (leftPane.scrollHeight - leftPane.clientHeight);
  }, [syncScroll]);

  /**
   * Set up resize event listeners
   */
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
    >
      {/* Left Pane - Text Editor */}
      <div
        ref={leftPaneRef}
        className="overflow-y-auto bg-white"
        style={{ width: `${leftWidth}%` }}
        onScroll={handleLeftScroll}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-700">Text Editor</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Edit your answers here
          </p>
        </div>
        <TextEditor
          answers={textContent}
          onEdit={onTextEdit}
          editedAnswers={editedAnswers}
        />
      </div>

      {/* Resize Handle */}
      <div
        className={`
          w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize
          transition-colors duration-150 flex-shrink-0
          ${isResizing ? 'bg-blue-500' : ''}
        `}
        onMouseDown={handleResizeStart}
      >
        <div className="h-full w-full relative">
          {/* Visual indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col gap-1">
              <div className="w-0.5 h-1 bg-white rounded"></div>
              <div className="w-0.5 h-1 bg-white rounded"></div>
              <div className="w-0.5 h-1 bg-white rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Canvas Preview */}
      <div
        ref={rightPaneRef}
        className="overflow-y-auto bg-gray-100"
        style={{ width: `${100 - leftWidth}%` }}
        onScroll={handleRightScroll}
      >
        <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-300 px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Handwritten Preview
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {handwrittenContent.length > 0
              ? `${handwrittenContent.length} page${
                  handwrittenContent.length !== 1 ? 's' : ''
                }`
              : 'Preview will appear here'}
          </p>
        </div>
        <div className="p-6">
          {handwrittenContent.length > 0 && state.selectedFont ? (
            <NotebookCanvas
              pages={handwrittenContent}
              pageStyle={state.selectedPageStyle}
              font={state.selectedFont}
              textColor={state.selectedColor}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg font-medium">No preview available</p>
                <p className="text-sm mt-2">
                  {!state.selectedFont 
                    ? 'Select a font to see handwritten preview'
                    : 'Generate answers to see handwritten preview'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
