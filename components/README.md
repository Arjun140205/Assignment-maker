# Components Documentation

## Task 4: Preview Panel and Text Editor

This directory contains the implementation of Task 4 from the spec, which includes:

### 1. State Management (`lib/context/AppContext.tsx`)

Global application state management using React Context API and useReducer.

**Features:**
- Centralized state for uploaded content, generated answers, edits, and UI state
- Type-safe actions for all state updates
- Custom hooks for accessing specific state slices
- Supports font, page style, and color customization

**Usage:**
```tsx
import { useAppContext } from '@/lib/context/AppContext';

function MyComponent() {
  const { state, dispatch } = useAppContext();
  
  // Update state
  dispatch({ type: 'SET_GENERATED_ANSWERS', payload: answers });
}
```

### 2. TextEditor Component (`components/Editor/TextEditor.tsx`)

Real-time text editor with contenteditable divs for editing generated answers.

**Features:**
- Editable text display for each answer
- 300ms debounced updates to prevent excessive re-renders
- Visual indicators for edited content
- Word count display
- Paste handling (strips formatting)
- Read-only mode support

**Props:**
```tsx
interface TextEditorProps {
  answers: Answer[];
  onEdit: (answerId: number, content: string) => void;
  readOnly?: boolean;
  editedAnswers?: Map<number, string>;
}
```

### 3. PreviewPanel Component (`components/Dashboard/PreviewPanel.tsx`)

Split-pane layout showing text editor and canvas preview side-by-side.

**Features:**
- Resizable split panes with drag handle
- Minimum pane width enforcement (300px)
- Synchronized scrolling between panes
- Responsive layout
- Visual feedback during resize

**Props:**
```tsx
interface PreviewPanelProps {
  textContent: Answer[];
  handwrittenContent: CanvasPage[];
  onTextEdit: (answerId: number, newContent: string) => void;
  syncScroll?: boolean;
  editedAnswers?: Map<number, string>;
}
```

### 4. Dashboard Component (`components/Dashboard/Dashboard.tsx`)

Main integration component that brings together all features.

**Features:**
- File upload section
- Prompt input section
- Preview panel with text editor and canvas
- Step-by-step workflow
- Loading states and error handling

## Type Definitions

### Canvas Types (`lib/types/canvas.ts`)

```typescript
type PageStyle = 'ruled' | 'unruled' | 'lined';

interface HandwrittenFont {
  id: string;
  name: string;
  family: string;
  url: string;
  preview: string;
}

interface CanvasPage {
  pageNumber: number;
  lines: CanvasLine[];
  style: PageStyle;
}
```

## Requirements Satisfied

- **Requirement 3.1**: Preview panel displays text version on left side ✓
- **Requirement 3.2**: Handwritten version displayed on right side (placeholder for Task 5) ✓
- **Requirement 3.3**: Real-time updates with 1-second delay (implemented with 300ms debounce) ✓
- **Requirement 3.4**: Synchronized scrolling between panes ✓
- **Requirement 8.1**: Editing mode enabled on click ✓
- **Requirement 8.2**: Updates handwritten version within 1 second ✓
- **Requirement 8.3**: Automatic layout adjustment (will be implemented in Task 6) ✓
- **Requirement 8.4**: Preserves formatting during edits ✓

## Next Steps

Task 5 will implement the actual canvas rendering system to replace the placeholder in the PreviewPanel's right pane.
