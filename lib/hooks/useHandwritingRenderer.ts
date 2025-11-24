/**
 * Custom hook for handwriting rendering with layout engine integration
 * Handles text edits and triggers layout recalculation
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { HandwritingRenderer } from '@/lib/services/handwritingRenderer';
import { Answer } from '@/lib/types/ai-service';
import { CanvasPage, HandwrittenFont, PageStyle } from '@/lib/types/canvas';

interface UseHandwritingRendererOptions {
  answers: Answer[];
  font: HandwrittenFont | null;
  pageStyle: PageStyle;
  color: string;
  onPagesUpdate?: (pages: CanvasPage[]) => void;
}

interface UseHandwritingRendererReturn {
  pages: CanvasPage[];
  isRendering: boolean;
  error: Error | null;
  recalculateLayout: () => Promise<void>;
  estimatePageCount: () => number;
}

/**
 * Hook for managing handwriting rendering with layout engine
 */
export function useHandwritingRenderer({
  answers,
  font,
  pageStyle,
  color,
  onPagesUpdate,
}: UseHandwritingRendererOptions): UseHandwritingRendererReturn {
  const rendererRef = useRef<HandwritingRenderer | null>(null);
  const [pages, setPages] = useState<CanvasPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize renderer
  useEffect(() => {
    if (typeof window !== 'undefined' && !rendererRef.current) {
      rendererRef.current = new HandwritingRenderer();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Recalculate layout
  const recalculateLayout = useCallback(async () => {
    if (!rendererRef.current || !font || answers.length === 0) {
      setPages([]);
      return;
    }

    setIsRendering(true);
    setError(null);

    try {
      const newPages = await rendererRef.current.renderAnswers(
        answers,
        font,
        color,
        pageStyle
      );

      setPages(newPages);

      if (onPagesUpdate) {
        onPagesUpdate(newPages);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to render pages');
      setError(error);
      console.error('Error rendering pages:', error);
    } finally {
      setIsRendering(false);
    }
  }, [answers, font, color, pageStyle, onPagesUpdate]);

  // Estimate page count
  const estimatePageCount = useCallback(() => {
    if (!rendererRef.current || !font || answers.length === 0) {
      return 0;
    }

    return rendererRef.current.estimatePageCount(answers, font);
  }, [answers, font]);

  // Trigger layout recalculation when dependencies change
  useEffect(() => {
    recalculateLayout();
  }, [recalculateLayout]);

  return {
    pages,
    isRendering,
    error,
    recalculateLayout,
    estimatePageCount,
  };
}
