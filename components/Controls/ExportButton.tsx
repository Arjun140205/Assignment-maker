'use client';

import React, { useState, useCallback } from 'react';
import { CanvasPage, PageStyle, HandwrittenFont, ExportError } from '@/lib/types/canvas';
import { pdfExporter, ExportOptions, ExportProgress } from '@/lib/services/pdfExporter';

interface ExportButtonProps {
  pages: CanvasPage[];
  font: HandwrittenFont;
  textColor: string;
  pageStyle: PageStyle;
  fileName?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ExportButton component - Handles PDF export with progress tracking
 */
const ExportButton: React.FC<ExportButtonProps> = ({
  pages,
  font,
  textColor,
  pageStyle,
  fileName = 'handwritten-assignment.pdf',
  disabled = false,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'a4',
    orientation: 'portrait',
    quality: 300,
    compression: true,
    progressive: pdfExporter.shouldUseProgressive(pages.length, 300),
    batchSize: pdfExporter.getRecommendedBatchSize(pages.length, 300),
  });

  /**
   * Handle export button click
   */
  const handleExport = useCallback(async () => {
    if (pages.length === 0) {
      setError('No pages to export');
      return;
    }

    setIsExporting(true);
    setError(null);
    setProgress({
      currentPage: 0,
      totalPages: pages.length,
      percentage: 0,
      stage: 'preparing',
    });

    try {
      // Set progress callback
      pdfExporter.setProgressCallback((prog) => {
        setProgress(prog);
      });

      // Export and download PDF
      await pdfExporter.exportAndDownload(
        pages,
        font,
        textColor,
        pageStyle,
        {
          ...exportOptions,
          fileName,
        }
      );

      // Success - clear progress after a short delay
      setTimeout(() => {
        setProgress(null);
        setIsExporting(false);
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);

      if (err instanceof ExportError) {
        setError(`Export failed at ${err.stage}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to export PDF');
      }

      setIsExporting(false);
      setProgress(null);
    }
  }, [pages, font, textColor, pageStyle, fileName, exportOptions]);

  /**
   * Toggle options panel
   */
  const toggleOptions = useCallback(() => {
    setShowOptions((prev) => !prev);
  }, []);

  /**
   * Update export option
   */
  const updateOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions((prev) => {
      const newOptions = {
        ...prev,
        [key]: value,
      };

      // Auto-adjust progressive and batch size when quality changes
      if (key === 'quality' && typeof value === 'number') {
        newOptions.progressive = pdfExporter.shouldUseProgressive(pages.length, value);
        newOptions.batchSize = pdfExporter.getRecommendedBatchSize(pages.length, value);
      }

      return newOptions;
    });
  }, [pages.length]);

  /**
   * Get estimated file size
   */
  const estimatedSize = pdfExporter.estimateFileSize(
    pages.length,
    exportOptions.quality || 300
  );

  /**
   * Get progress message
   */
  const getProgressMessage = (): string => {
    if (!progress) return '';

    if (progress.message) {
      return progress.message;
    }

    switch (progress.stage) {
      case 'preparing':
        return 'Preparing export...';
      case 'rendering':
        return `Rendering page ${progress.currentPage} of ${progress.totalPages}...`;
      case 'generating':
        return 'Generating PDF...';
      case 'complete':
        return 'Export complete!';
      case 'error':
        return 'Export failed';
      default:
        return '';
    }
  };

  const isDisabled = disabled || pages.length === 0 || isExporting;

  return (
    <div className={`export-button-container ${className}`}>
      {/* Main Export Button */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={isDisabled}
          className={`
            flex-1 px-6 py-3 rounded-lg font-medium text-white
            transition-all duration-200
            ${isDisabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-hover active:scale-[0.98]'
            }
            ${isExporting ? 'cursor-wait' : ''}
          `}
        >
          {isExporting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
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
              Exporting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export PDF
            </span>
          )}
        </button>

        {/* Options Toggle Button */}
        <button
          onClick={toggleOptions}
          disabled={isExporting}
          className={`
            px-4 py-3 rounded-lg font-medium border
            transition-all duration-200
            ${isExporting
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }
          `}
          title="Export options"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{getProgressMessage()}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${progress.stage === 'error'
                  ? 'bg-red-500'
                  : progress.stage === 'complete'
                    ? 'bg-green-500'
                    : 'bg-blue-600'
                }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Export Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Export Options Panel */}
      {showOptions && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Export Options</h3>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateOption('format', 'a4')}
                className={`
                  flex-1 px-4 py-2 rounded-lg border-2 transition-all
                  ${exportOptions.format === 'a4'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                A4
              </button>
              <button
                onClick={() => updateOption('format', 'letter')}
                className={`
                  flex-1 px-4 py-2 rounded-lg border-2 transition-all
                  ${exportOptions.format === 'letter'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                Letter
              </button>
            </div>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality (DPI)
            </label>
            <select
              value={exportOptions.quality}
              onChange={(e) => updateOption('quality', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={150}>150 DPI (Draft)</option>
              <option value={300}>300 DPI (Standard)</option>
              <option value={600}>600 DPI (High Quality)</option>
            </select>
          </div>

          {/* Compression Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Enable Compression
            </label>
            <button
              onClick={() => updateOption('compression', !exportOptions.compression)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${exportOptions.compression ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${exportOptions.compression ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Progressive Rendering Toggle (for large documents) */}
          {pages.length > 10 && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  Progressive Rendering
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recommended for {pages.length} pages
                </p>
              </div>
              <button
                onClick={() => updateOption('progressive', !exportOptions.progressive)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${exportOptions.progressive ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${exportOptions.progressive ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          )}

          {/* Batch Size (only show if progressive is enabled) */}
          {exportOptions.progressive && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
                <span className="text-xs text-gray-500 ml-2">
                  (pages per batch)
                </span>
              </label>
              <select
                value={exportOptions.batchSize}
                onChange={(e) => updateOption('batchSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 pages (Low memory)</option>
                <option value={5}>5 pages (Balanced)</option>
                <option value={10}>10 pages (Fast)</option>
              </select>
            </div>
          )}

          {/* File Info */}
          <div className="pt-3 border-t border-gray-200 space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Pages:</span>
              <span className="font-medium">{pages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Size:</span>
              <span className="font-medium">
                {pdfExporter.formatFileSize(estimatedSize)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="font-medium">
                ~{pdfExporter.estimateMemoryUsage(pages.length, exportOptions.quality || 300)} MB
              </span>
            </div>
            {exportOptions.progressive && (
              <div className="flex justify-between text-blue-600">
                <span>Mode:</span>
                <span className="font-medium">Progressive</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
