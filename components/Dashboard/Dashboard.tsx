'use client';

/**
 * Main Dashboard component integrating all features
 */

import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import UnifiedInput from './UnifiedInput';
import { InlineLoader } from './LoadingSpinner';
import { ExtractedContent, Answer, HandwrittenFont, PageStyle } from '@/lib/types';
import { useHandwritingRenderer } from '@/lib/hooks/useHandwritingRenderer';

// Lazy load heavy components
const PreviewPanel = lazy(() => import('./PreviewPanel'));
const WelcomeModal = lazy(() => import('./WelcomeModal').then(mod => ({ default: mod.default })));
const FontSelector = lazy(() => import('@/components/Controls/FontSelector'));
const PageStyleSelector = lazy(() => import('@/components/Controls/PageStyleSelector'));
const ColorPicker = lazy(() => import('@/components/Controls/ColorPicker'));
const ExportButton = lazy(() => import('@/components/Controls/ExportButton'));

// Import useShouldShowWelcome separately since it's not a component
import { useShouldShowWelcome } from './WelcomeModal';

export default function Dashboard() {
  const { state, dispatch } = useAppContext();
  const { success, error: showError, info } = useNotifications();
  const shouldShowWelcome = useShouldShowWelcome();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal on first visit
  useEffect(() => {
    if (shouldShowWelcome) {
      setShowWelcome(true);
    }
  }, [shouldShowWelcome]);

  // Merge generated answers with edited answers
  const currentAnswers = useMemo(() => {
    return state.generatedAnswers.map((answer) => {
      const editedContent = state.editedAnswers.get(answer.questionNumber);
      if (editedContent) {
        return {
          ...answer,
          content: editedContent,
          wordCount: editedContent.split(/\s+/).filter(Boolean).length,
        };
      }
      return answer;
    });
  }, [state.generatedAnswers, state.editedAnswers]);

  // Use handwriting renderer hook with layout engine integration
  const { pages, isRendering, recalculateLayout } = useHandwritingRenderer({
    answers: currentAnswers,
    font: state.selectedFont,
    pageStyle: state.selectedPageStyle,
    color: state.selectedColor,
    onPagesUpdate: (newPages) => {
      dispatch({ type: 'SET_CANVAS_PAGES', payload: newPages });
    },
  });

  // Update rendering state in context
  useEffect(() => {
    dispatch({ type: 'SET_RENDERING', payload: isRendering });
  }, [isRendering, dispatch]);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    (content: ExtractedContent) => {
      dispatch({ type: 'SET_UPLOADED_CONTENT', payload: content });
      success('File uploaded successfully!');
    },
    [dispatch, success]
  );

  /**
   * Handle file upload error
   */
  const handleFileUploadError = useCallback(
    (errorMessage: string) => {
      showError(errorMessage);
    },
    [showError]
  );

  /**
   * Handle prompt submission
   */
  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      dispatch({ type: 'SET_GENERATING', payload: true });
      info('Generating answers...');

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context: state.uploadedContent?.text || '',
          }),
        });

        const result = await response.json();

        if (result.success && result.data?.answers) {
          dispatch({
            type: 'SET_GENERATED_ANSWERS',
            payload: result.data.answers,
          });
          success(`Generated ${result.data.answers.length} answer(s) successfully using ${result.data.provider}!`);
        } else {
          showError(result.error?.message || 'Failed to generate answers');
        }
      } catch (error) {
        console.error('Generation error:', error);
        showError('Failed to generate answers. Please try again.');
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    [dispatch, state.uploadedContent, info, success, showError]
  );

  /**
   * Handle text edit - triggers layout recalculation
   */
  const handleTextEdit = useCallback(
    (answerId: number, content: string) => {
      dispatch({
        type: 'EDIT_ANSWER',
        payload: { id: answerId, content },
      });
      // Layout recalculation will be triggered automatically by the hook
      // when currentAnswers changes
    },
    [dispatch]
  );

  /**
   * Handle font change
   */
  const handleFontChange = useCallback(
    (font: HandwrittenFont) => {
      dispatch({ type: 'SET_FONT', payload: font });
    },
    [dispatch]
  );

  /**
   * Handle page style change
   */
  const handlePageStyleChange = useCallback(
    (style: PageStyle) => {
      dispatch({ type: 'SET_PAGE_STYLE', payload: style });
    },
    [dispatch]
  );

  /**
   * Handle color change
   */
  const handleColorChange = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_COLOR', payload: color });
    },
    [dispatch]
  );

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><InlineLoader message="Loading..." /></div>}>
          <WelcomeModal onClose={() => setShowWelcome(false)} />
        </Suspense>
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Handwritten Assignment Generator
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Transform your assignments into handwritten documents
            </p>
          </div>
        </header>

        {/* Main Content - ChatGPT-like Layout */}
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Messages/Content Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">{/* Customization Controls Section */}
          {state.generatedAnswers.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Customize Appearance
              </h2>
              <Suspense fallback={<InlineLoader message="Loading controls..." />}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {/* Font Selector */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    {state.selectedFont && (
                      <FontSelector
                        selectedFont={state.selectedFont}
                        onFontChange={handleFontChange}
                      />
                    )}
                  </div>

                  {/* Page Style Selector */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <PageStyleSelector
                      selectedStyle={state.selectedPageStyle}
                      onStyleChange={handlePageStyleChange}
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <ColorPicker
                      selectedColor={state.selectedColor}
                      onColorChange={handleColorChange}
                    />
                  </div>
                </div>

                {/* Export Button */}
                {state.canvasPages.length > 0 && state.selectedFont && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <h3 className="text-sm sm:text-md font-semibold text-gray-900 mb-3">
                      Export Your Document
                    </h3>
                    <ExportButton
                      pages={state.canvasPages}
                      font={state.selectedFont}
                      textColor={state.selectedColor}
                      pageStyle={state.selectedPageStyle}
                      fileName="handwritten-assignment.pdf"
                      disabled={state.isRendering}
                    />
                  </div>
                )}
              </Suspense>
            </section>
          )}

          {/* Preview Panel Section */}
          {state.generatedAnswers.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Review and Edit
                </h2>
                {state.isRendering && (
                  <InlineLoader message="Rendering handwriting..." />
                )}
              </div>
              <div className="h-[500px] lg:h-[600px] xl:h-[700px]">
                <Suspense fallback={<InlineLoader message="Loading preview..." />}>
                  <PreviewPanel
                    textContent={state.generatedAnswers}
                    handwrittenContent={state.canvasPages}
                    onTextEdit={handleTextEdit}
                    editedAnswers={state.editedAnswers}
                    syncScroll={true}
                  />
                </Suspense>
              </div>
            </section>
          )}
            </div>
          </div>

          {/* Input Area - Fixed at Bottom (ChatGPT-like) */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <UnifiedInput
                onSubmit={handlePromptSubmit}
                onFileUpload={handleFileUpload}
                onError={handleFileUploadError}
                uploadedContent={state.uploadedContent?.text || null}
                isGenerating={state.isGenerating}
              />
            </div>
          </div>
        </main>


      </div>
    </>
  );
}
