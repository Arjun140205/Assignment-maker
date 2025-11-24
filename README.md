# Handwritten Assignment Generator

A Next.js web application that converts digital assignment content into realistic handwritten documents. Students can upload assignments in various formats (PDF, DOCX, images, or text), provide prompts specifying requirements, and receive AI-generated answers that are automatically rendered in a handwritten style on customizable notebook pages.

## Features

- 📄 Multi-format file upload (PDF, DOCX, images, text)
- 🤖 AI-powered content generation (OpenAI/Gemini)
- ✍️ 100+ handwritten font styles
- 📝 Real-time text editing with live preview
- 🎨 Customizable page styles (ruled, unruled, lined)
- 🌈 Multiple text color options
- 📥 High-quality PDF export (300 DPI)
- 🎯 Intelligent layout engine with automatic page breaks

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API / Google Gemini API
- **File Processing**: pdf-parse, mammoth, tesseract.js
- **Canvas Rendering**: HTML5 Canvas API, fabric.js
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key or Google Gemini API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

3. Add your API keys to `.env.local`:

```env
NEXT_PUBLIC_AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
# OR
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build

Create a production build:

```bash
npm run build
npm run start
```

## Project Structure

```
handwritten-assignment-generator/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── upload/        # File upload processing
│   │   ├── generate/      # AI content generation
│   │   └── fonts/         # Font management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── Dashboard/         # Upload, prompt, and preview components
│   ├── Canvas/            # Handwriting rendering components
│   ├── Editor/            # Text editing components
│   └── Controls/          # Font, style, and color selectors
├── lib/                   # Utilities and services
│   ├── services/          # Core business logic
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
└── public/                # Static assets
    └── fonts/             # Handwritten font files
        └── handwritten/
```

## Environment Variables

See `.env.example` for all available configuration options:

- `NEXT_PUBLIC_AI_PROVIDER`: AI provider ('openai' or 'gemini')
- `OPENAI_API_KEY`: OpenAI API key
- `GEMINI_API_KEY`: Google Gemini API key
- `NEXT_PUBLIC_MAX_FILE_SIZE`: Maximum file upload size in bytes (default: 50MB)
- `NEXT_PUBLIC_FONT_CDN_URL`: Optional CDN URL for fonts

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
