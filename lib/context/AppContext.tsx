'use client';

/**
 * Global application state management using React Context and useReducer
 */

import { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ExtractedContent,
  Answer,
  HandwrittenFont,
  PageStyle,
  CanvasPage,
} from '@/lib/types';

/**
 * Application state interface
 */
export interface AppState {
  uploadedContent: ExtractedContent | null;
  prompt: string;
  generatedAnswers: Answer[];
  editedAnswers: Map<number, string>;
  selectedFont: HandwrittenFont;
  selectedPageStyle: PageStyle;
  selectedColor: string;
  canvasPages: CanvasPage[];
  isGenerating: boolean;
  isRendering: boolean;
}

/**
 * Application action types
 */
export type AppAction =
  | { type: 'SET_UPLOADED_CONTENT'; payload: ExtractedContent }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_GENERATED_ANSWERS'; payload: Answer[] }
  | { type: 'EDIT_ANSWER'; payload: { id: number; content: string } }
  | { type: 'SET_FONT'; payload: HandwrittenFont }
  | { type: 'SET_PAGE_STYLE'; payload: PageStyle }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_CANVAS_PAGES'; payload: CanvasPage[] }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_RENDERING'; payload: boolean }
  | { type: 'RESET_STATE' };

/**
 * Initial application state
 */
const initialState: AppState = {
  uploadedContent: null,
  prompt: '',
  generatedAnswers: [],
  editedAnswers: new Map(),
  selectedFont: {
    id: 'caveat',
    name: 'Caveat',
    family: 'Caveat',
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog'
  },
  selectedPageStyle: 'ruled',
  selectedColor: '#000000',
  canvasPages: [],
  isGenerating: false,
  isRendering: false,
};

/**
 * Application state reducer
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_UPLOADED_CONTENT':
      return {
        ...state,
        uploadedContent: action.payload,
      };

    case 'SET_PROMPT':
      return {
        ...state,
        prompt: action.payload,
      };

    case 'SET_GENERATED_ANSWERS':
      return {
        ...state,
        generatedAnswers: action.payload,
        editedAnswers: new Map(), // Clear edits when new answers are generated
      };

    case 'EDIT_ANSWER':
      const newEditedAnswers = new Map(state.editedAnswers);
      newEditedAnswers.set(action.payload.id, action.payload.content);
      return {
        ...state,
        editedAnswers: newEditedAnswers,
      };

    case 'SET_FONT':
      return {
        ...state,
        selectedFont: action.payload,
      };

    case 'SET_PAGE_STYLE':
      return {
        ...state,
        selectedPageStyle: action.payload,
      };

    case 'SET_COLOR':
      return {
        ...state,
        selectedColor: action.payload,
      };

    case 'SET_CANVAS_PAGES':
      return {
        ...state,
        canvasPages: action.payload,
      };

    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.payload,
      };

    case 'SET_RENDERING':
      return {
        ...state,
        isRendering: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

/**
 * Context type
 */
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Create context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provider component props
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Application context provider
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to use app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}

/**
 * Helper hooks for specific state slices
 */

export function useUploadedContent() {
  const { state } = useAppContext();
  return state.uploadedContent;
}

export function useGeneratedAnswers() {
  const { state } = useAppContext();
  return state.generatedAnswers;
}

export function useEditedAnswers() {
  const { state } = useAppContext();
  return state.editedAnswers;
}

export function useSelectedFont() {
  const { state } = useAppContext();
  return state.selectedFont;
}

export function useSelectedPageStyle() {
  const { state } = useAppContext();
  return state.selectedPageStyle;
}

export function useSelectedColor() {
  const { state } = useAppContext();
  return state.selectedColor;
}

export function useCanvasPages() {
  const { state } = useAppContext();
  return state.canvasPages;
}

export function useIsGenerating() {
  const { state } = useAppContext();
  return state.isGenerating;
}

export function useIsRendering() {
  const { state } = useAppContext();
  return state.isRendering;
}
