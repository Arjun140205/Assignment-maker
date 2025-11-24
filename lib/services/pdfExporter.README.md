# PDF Exporter Service

## Overview

The PDF Exporter service handles exporting canvas pages to high-quality PDF documents with support for large documents through progressive rendering and memory management.

## Features

### Standard Export
- High-resolution rendering (up to 600 DPI)
- Custom font embedding
- Multiple page formats (A4, Letter)
- Compression options

### Progressive Export (for Large Documents)
- Batch processing to manage memory usage
- Automatic memory cleanup between batches
- Progress tracking for long exports
- Configurable batch sizes

## Usage

### Basic Export

```typescript
import { pdfExporter } from '@/lib/services/pdfExporter';

// Export with default options
const pdfBlob = await pdfExporter.exportToPDF(
  pages,
  font,
  textColor,
  pageStyle
);

// Download the PDF
await pdfExporter.downloadPDF(pdfBlob, 'my-assignment.pdf');
```

### Export with Options

```typescript
const options = {
  format: 'a4',           // 'a4' or 'letter'
  orientation: 'portrait', // 'portrait' or 'landscape'
  quality: 300,           // DPI (72-600)
  compression: true,      // Enable PDF compression
  progressive: true,      // Enable progressive rendering
  batchSize: 5,          // Pages per batch
  memoryLimit: 100       // Memory limit in MB
};

const pdfBlob = await pdfExporter.exportToPDF(
  pages,
  font,
  textColor,
  pageStyle,
  options
);
```

### One-Step Export and Download

```typescript
await pdfExporter.exportAndDownload(
  pages,
  font,
  textColor,
  pageStyle,
  {
    fileName: 'handwritten-assignment.pdf',
    quality: 300,
    compression: true
  }
);
```

## Progressive Rendering

Progressive rendering is automatically enabled for documents with more than 20 pages or when using high quality settings (600 DPI).

### How It Works

1. **Batch Processing**: Pages are processed in small batches (default: 5 pages)
2. **Memory Management**: Canvas cache is cleared between batches
3. **Progress Updates**: Real-time progress callbacks during export
4. **Automatic Optimization**: Batch size adjusts based on quality settings

### When to Use Progressive Rendering

- Documents with 20+ pages
- High quality exports (600 DPI)
- Limited memory environments
- When export progress tracking is needed

### Batch Size Recommendations

| Quality | Recommended Batch Size | Memory Usage |
|---------|----------------------|--------------|
| 150 DPI | 10 pages | Low |
| 300 DPI | 5 pages | Medium |
| 600 DPI | 3 pages | High |

## Memory Management

The exporter includes automatic memory management:

- **Canvas Caching**: Temporary canvases are cached and cleaned up
- **Memory Tracking**: Approximate memory usage is monitored
- **Automatic Cleanup**: Cache is cleared when memory limit is reached
- **Batch Delays**: Small delays between batches allow browser to process

### Memory Estimates

```typescript
// Estimate memory usage before export
const memoryMB = pdfExporter.estimateMemoryUsage(pageCount, quality);
console.log(`Estimated memory: ${memoryMB} MB`);

// Check if progressive rendering is recommended
const useProgressive = pdfExporter.shouldUseProgressive(pageCount, quality);

// Get recommended batch size
const batchSize = pdfExporter.getRecommendedBatchSize(pageCount, quality);
```

## Progress Tracking

Track export progress with callbacks:

```typescript
pdfExporter.setProgressCallback((progress) => {
  console.log(`Stage: ${progress.stage}`);
  console.log(`Progress: ${progress.percentage}%`);
  console.log(`Page: ${progress.currentPage}/${progress.totalPages}`);
  console.log(`Message: ${progress.message}`);
});

await pdfExporter.exportToPDF(pages, font, textColor, pageStyle);
```

### Progress Stages

- `preparing`: Initializing export
- `rendering`: Rendering pages to canvas
- `generating`: Creating PDF document
- `complete`: Export finished successfully
- `error`: Export failed

## File Size Estimation

```typescript
// Estimate final PDF file size
const estimatedBytes = pdfExporter.estimateFileSize(pageCount, quality);
const formattedSize = pdfExporter.formatFileSize(estimatedBytes);
console.log(`Estimated size: ${formattedSize}`);
```

## Error Handling

```typescript
import { ExportError } from '@/lib/services/pdfExporter';

try {
  await pdfExporter.exportAndDownload(pages, font, textColor, pageStyle);
} catch (error) {
  if (error instanceof ExportError) {
    console.error(`Export failed at ${error.stage}: ${error.message}`);
  }
}
```

## Validation

Validate export options before processing:

```typescript
const validation = pdfExporter.validateOptions(options);

if (!validation.valid) {
  console.error('Invalid options:', validation.errors);
}
```

## Performance Tips

1. **Use Compression**: Enable compression for smaller file sizes
2. **Choose Appropriate Quality**: 300 DPI is sufficient for most cases
3. **Enable Progressive**: Let the system auto-enable for large documents
4. **Adjust Batch Size**: Smaller batches for high quality, larger for speed
5. **Monitor Memory**: Check estimates before exporting very large documents

## Limitations

- Maximum quality: 600 DPI
- Minimum quality: 72 DPI
- Browser memory constraints apply
- Very large documents (100+ pages) may take several minutes
- Font embedding requires fonts to be loaded first

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may have memory limitations on iOS)
- Mobile browsers: Limited by device memory
