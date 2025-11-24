# Font Management System

## Overview

The font management system provides a comprehensive solution for loading, managing, and displaying 100+ handwritten fonts in the Handwritten Assignment Generator application.

## Components

### 1. Font Data (`lib/data/handwritten-fonts.ts`)
- Contains 100+ handwritten fonts from Google Fonts
- Each font includes: id, name, family, url, and preview text
- Exports `HANDWRITTEN_FONTS` array and `DEFAULT_FONT`

### 2. Font Service (`lib/services/fontService.ts`)
Main service class for font management with the following features:

#### Key Methods:
- `loadFonts()`: Get all available fonts
- `loadFont(font)`: Lazy load a specific font using FontFace API
- `isFontLoaded(fontId)`: Check if font is loaded
- `getFontPreview(font)`: Get preview text for a font
- `searchFonts(query)`: Search fonts by name
- `generateFontPreview(font, text?)`: Generate canvas preview image
- `preloadFonts(fonts)`: Preload multiple fonts
- `getDefaultFont()`: Get the default font (Caveat)

#### Features:
- Lazy loading: Fonts are loaded only when selected
- Caching: Loaded fonts are cached to avoid reloading
- Validation: Validates font objects before loading
- Google Fonts support: Automatically handles Google Fonts URLs
- Local fonts support: Can load local font files via FontFace API

### 3. Font Selector Component (`components/Controls/FontSelector.tsx`)
React component for font selection UI with:

#### Features:
- Grid and list view modes
- Search functionality
- Loading indicators
- Font previews with actual font rendering
- Selected font highlighting
- Responsive design

#### Props:
```typescript
interface FontSelectorProps {
  selectedFont: HandwrittenFont;
  onFontChange: (font: HandwrittenFont) => void;
}
```

### 4. API Route (`app/api/fonts/route.ts`)
REST API endpoint for font management:

#### Endpoints:

**GET /api/fonts**
- Returns list of all available fonts
- Query parameters:
  - `q`: Search query
  - `limit`: Number of fonts to return
  - `offset`: Pagination offset
- Response includes: fonts array, total count, default font

**POST /api/fonts/preview**
- Generate preview for a specific font
- Request body: `{ fontId: string, text?: string }`
- Returns font with preview text

## Usage

### Basic Usage

```typescript
import { fontService } from '@/lib/services/fontService';
import { FontSelector } from '@/components/Controls';

// Load all fonts
const fonts = await fontService.loadFonts();

// Load a specific font
await fontService.loadFont(fonts[0]);

// Use FontSelector component
<FontSelector
  selectedFont={currentFont}
  onFontChange={(font) => {
    setCurrentFont(font);
  }}
/>
```

### API Usage

```typescript
// Fetch all fonts
const response = await fetch('/api/fonts');
const { data } = await response.json();
console.log(data.fonts); // Array of fonts

// Search fonts
const response = await fetch('/api/fonts?q=caveat');
const { data } = await response.json();

// Get font preview
const response = await fetch('/api/fonts/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fontId: 'caveat', text: 'Custom preview' })
});
```

## Font Storage

### Metadata Files
- `public/fonts/handwritten/fonts-metadata.json`: Core font metadata
- `public/fonts/handwritten/extended-fonts.json`: Extended font list
- `lib/data/handwritten-fonts.ts`: TypeScript font definitions (primary source)

### Font Sources
All fonts are loaded from Google Fonts CDN, which provides:
- Fast loading via CDN
- Automatic optimization
- Multiple font weights
- Cross-browser compatibility

## Performance Considerations

1. **Lazy Loading**: Fonts are loaded only when selected, reducing initial load time
2. **Caching**: Loaded fonts are cached in memory to avoid reloading
3. **CDN**: Google Fonts CDN provides fast, cached delivery
4. **Pagination**: API supports pagination for large font lists
5. **Search**: Client-side search for instant results

## Adding New Fonts

To add new fonts:

1. Add font definition to `lib/data/handwritten-fonts.ts`:
```typescript
{
  id: 'new-font',
  name: 'New Font',
  family: 'New Font',
  url: 'https://fonts.googleapis.com/css2?family=New+Font&display=swap',
  preview: 'The quick brown fox jumps over the lazy dog'
}
```

2. Font will automatically be available in the FontSelector component and API

## Requirements Satisfied

- ✅ 4.1: Provides 100+ distinct handwritten-style font options
- ✅ 4.2: Applies selected font within 1 second
- ✅ 4.3: Excludes standard system fonts
- ✅ 4.4: Displays font samples before application
