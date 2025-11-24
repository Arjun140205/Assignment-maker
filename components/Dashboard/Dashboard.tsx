'use client';

/**
 * Main Dashboard component integrating all features
 * This is an example integration showing how the components work together
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import UploadSection from './UploadSection';
import PromptInput from './PromptInput';
import PreviewPanel from './PreviewPanel';
import { FontSelector, PageStyleSelector, ColorPicker } from '@/components/Controls';
import { ExtractedContent, Answer, HandwrittenFont, PageStyle } from '@/lib/types';
import { useHandwritingRenderer } from '@/lib/hooks/useHandwritingRenderer';

export default function Dashboard() {
  const { state, dispatch } = useAppContext();

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
    },
    [dispatch]
  );

  /**
   * Handle prompt submission
   */
  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      dispatch({ type: 'SET_GENERATING', payload: true });

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

        if (result.success) {
          dispatch({
            type: 'SET_GENERATED_ANSWERS',
            payload: result.response.answers,
          });
        }
      } catch (error) {
        console.error('Generation error:', error);
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    [dispatch, state.uploadedContent]
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Handwritten Assignment Generator
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Transform your assignments into handwritten documents
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Step 1: Upload Your Assignment
            </h2>
            <UploadSection onFileUpload={handleFileUpload} />
          </section>

          {/* Prompt Input Section */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Step 2: Enter Your Prompt
            </h2>
            <PromptInput
              onSubmit={handlePromptSubmit}
              uploadedContent={state.uploadedContent?.text || null}
              isGenerating={state.isGenerating}
            />
          </section>

          {/* Customization Controls Section */}
          {state.generatedAnswers.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Step 3: Customize Appearance
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Font Selector */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {state.selectedFont && (
                    <FontSelector
                      selectedFont={state.selectedFont}
                      onFontChange={handleFontChange}
                    />
                  )}
                </div>

                {/* Page Style Selector */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <PageStyleSelector
                    selectedStyle={state.selectedPageStyle}
                    onStyleChange={handlePageStyleChange}
                  />
                </div>

                {/* Color Picker */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <ColorPicker
                    selectedColor={state.selectedColor}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Preview Panel Section */}
          {state.generatedAnswers.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Step 4: Review and Edit
              </h2>
              <div className="h-[600px]">
                <PreviewPanel
                  textContent={state.generatedAnswers}
                  handwrittenContent={state.canvasPages}
                  onTextEdit={handleTextEdit}
                  editedAnswers={state.editedAnswers}
                  syncScroll={true}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
