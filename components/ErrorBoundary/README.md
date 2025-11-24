# Error Boundary Components

This directory contains React error boundary components for comprehensive error handling throughout the application.

## Components

### ErrorBoundary
Main error boundary component that catches React errors and displays fallback UI.

**Features:**
- Catches errors in child components
- Displays user-friendly error messages
- Provides "Try Again" and "Reload Page" options
- Shows detailed error information in development mode
- Supports custom fallback UI
- Supports reset keys for automatic error recovery

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### ErrorFallback Components
Specialized error fallback components for different error types:

- **ErrorFallback**: Generic error fallback
- **FileProcessingErrorFallback**: For file upload/processing errors
- **AIGenerationErrorFallback**: For AI generation errors
- **ExportErrorFallback**: For PDF export errors
- **RenderingErrorFallback**: For canvas rendering errors

**Usage:**
```tsx
import { FileProcessingErrorFallback } from '@/components/ErrorBoundary/ErrorFallback';

<ErrorBoundary fallback={<FileProcessingErrorFallback error={error} />}>
  <UploadSection />
</ErrorBoundary>
```

## Error Types

The application uses custom error classes for different failure scenarios:

- **FileProcessingError**: File upload and processing failures
- **AIGenerationError**: AI content generation failures
- **ExportError**: PDF export failures
- **RenderingError**: Canvas rendering failures

Each error class includes:
- Descriptive error message
- Error code for programmatic handling
- Original error for debugging
- Additional context (file type, provider, page number, etc.)

## Implementation

The main application layout wraps all content with an ErrorBoundary to catch any unhandled errors:

```tsx
// app/layout.tsx
<ErrorBoundary>
  <NotificationProvider>
    <AppProvider>
      {children}
    </AppProvider>
  </NotificationProvider>
</ErrorBoundary>
```

## Best Practices

1. **Use specific error boundaries** for critical sections
2. **Provide meaningful error messages** to users
3. **Log errors** for debugging and monitoring
4. **Offer recovery options** when possible
5. **Show detailed errors** only in development mode
