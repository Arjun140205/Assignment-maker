'use client';

/**
 * Main Dashboard component integrating all features
 */

import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { useNotifications } from '@/lib/context/NotificationContext';
import EnhancedUnifiedInput from './EnhancedUnifiedInput';
import { InlineLoader } from './LoadingSpinner';
import { ExtractedContent, Answer, HandwrittenFont, PageStyle } from '@/lib/types';
import { useHandwritingRenderer } from '@/lib/hooks/useHandwritingRenderer';

// Lazy load heavy components
const PreviewPanel = lazy(() => import('./PreviewPanel'));
const WelcomeModal = lazy(() => import('./WelcomeModal').then(mod => ({ default: mod.default })));
const FontSelectorDropdown = lazy(() => import('@/components/Controls/FontSelectorDropdown'));
const PageStyleSelectorDropdown = lazy(() => import('@/components/Controls/PageStyleSelectorDropdown'));
const ColorPickerDropdown = lazy(() => import('@/components/Controls/ColorPickerDropdown'));
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
    async (prompt: string, directContext?: string) => {
      dispatch({ type: 'SET_GENERATING', payload: true });
      info('Generating answers...');

      // Use direct context if provided, otherwise use uploaded content
      const contextToUse = directContext || state.uploadedContent?.text || '';

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context: contextToUse,
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
        {/* Header with gradient */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg flex-shrink-0 sticky top-0 z-40 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Handwritten Assignment Generator
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  ✨ Transform your assignments into authentic handwritten documents
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - ChatGPT-like Layout */}
        <main id="main-content" className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Messages/Content Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">{/* Customization Controls Section */}
          {state.generatedAnswers.length > 0 && (
            <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200/50 hover-lift animate-scale-in">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Customize Appearance
                  </h2>
                  <p className="text-xs text-gray-600">Choose your handwriting style</p>
                </div>
              </div>
              <Suspense fallback={<InlineLoader message="Loading controls..." />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Font Selector Dropdown */}
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all hover-lift shadow-sm">
                    <FontSelectorDropdown
                      selectedFont={state.selectedFont}
                      onFontChange={handleFontChange}
                    />
                  </div>

                  {/* Color Picker Dropdown */}
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all hover-lift shadow-sm">
                    <ColorPickerDropdown
                      selectedColor={state.selectedColor}
                      onColorChange={handleColorChange}
                    />
                  </div>

                  {/* Page Style Selector Dropdown */}
                  <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all hover-lift shadow-sm">
                    <PageStyleSelectorDropdown
                      selectedStyle={state.selectedPageStyle}
                      onStyleChange={handlePageStyleChange}
                    />
                  </div>
                </div>

                {/* Export Button */}
                {state.canvasPages.length > 0 && state.selectedFont && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm sm:text-md font-bold text-gray-900">
                        Export Your Document
                      </h3>
                    </div>
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
            <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200/50 hover-lift animate-scale-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Review and Edit
                    </h2>
                    <p className="text-xs text-gray-600">Edit text and preview handwriting</p>
                  </div>
                </div>
                {state.isRendering && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Rendering...
                  </div>
                )}
              </div>
              <div className="h-[500px] lg:h-[600px] xl:h-[700px] rounded-xl overflow-hidden border-2 border-gray-200/50">
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
          <div className="flex-shrink-0 border-t-2 border-gray-200/50 bg-white/80 backdrop-blur-lg shadow-2xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <EnhancedUnifiedInput
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
