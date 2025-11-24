/**
 * Custom hook for handwriting rendering with layout engine integration
 * Handles text edits and triggers layout recalculation with debouncing
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { HandwritingRenderer } from '@/lib/services/handwritingRenderer';
import { Answer } from '@/lib/types/ai-service';
import { CanvasPage, HandwrittenFont, PageStyle } from '@/lib/types/canvas';
import { debounce } from '@/lib/utils/performance';

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

  // Recalculate layout (raw function)
  const recalculateLayoutRaw = useCallback(async () => {
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

  // Debounced version for automatic recalculation (300ms delay)
  const debouncedRecalculate = useRef(
    debounce((fn: () => Promise<void>) => fn(), 300)
  );

  // Public recalculate function (immediate, no debounce)
  const recalculateLayout = useCallback(async () => {
    await recalculateLayoutRaw();
  }, [recalculateLayoutRaw]);

  // Estimate page count
  const estimatePageCount = useCallback(() => {
    if (!rendererRef.current || !font || answers.length === 0) {
      return 0;
    }

    return rendererRef.current.estimatePageCount(answers, font);
  }, [answers, font]);

  // Trigger debounced layout recalculation when dependencies change
  // This prevents excessive re-renders during rapid text edits
  useEffect(() => {
    debouncedRecalculate.current(recalculateLayoutRaw);
  }, [recalculateLayoutRaw]);

  return {
    pages,
    isRendering,
    error,
    recalculateLayout,
    estimatePageCount,
  };
}
