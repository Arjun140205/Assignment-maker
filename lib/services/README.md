# AI Content Generation System

This directory contains the AI service implementation for generating assignment answers using OpenAI or Google Gemini.

## Components

### AIService (`aiService.ts`)

The main service class that handles AI content generation with provider abstraction.

**Features:**
- Support for OpenAI (GPT-4) and Google Gemini
- Automatic prompt parsing to extract word count and question requirements
- Retry logic with exponential backoff
- Structured response formatting
- Comprehensive error handling

**Usage:**

```typescript
import { AIService } from '@/lib/services/aiService';
import { AIProvider } from '@/lib/types/ai-service';

// Create service instance
const aiService = new AIService({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4o-mini', // optional
  maxRetries: 3, // optional
  timeout: 30000, // optional
});

// Generate answers
const response = await aiService.generateAnswers({
  prompt: 'Generate 3 answers, each approximately 200 words...',
  context: 'Content from uploaded file...',
});

console.log(response.answers); // Array of Answer objects
console.log(response.totalWords); // Total word count
```

### API Route (`/api/generate`)

REST API endpoint for AI content generation.

**Endpoint:** `POST /api/generate`

**Request Body:**
```json
{
  "prompt": "Generate answers for the following questions...",
  "context": "Content extracted from uploaded file",
  "wordCount": 200,
  "questionCount": 3
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "answers": [
      {
        "questionNumber": 1,
        "content": "Answer text...",
        "wordCount": 198
      }
    ],
    "totalWords": 594,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400/500/503):**
```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "retryable": true,
    "provider": "openai"
  }
}
```

## Configuration

Set the following environment variables:

```bash
# Choose provider: 'openai' or 'gemini'
NEXT_PUBLIC_AI_PROVIDER=openai

# OpenAI API Key
OPENAI_API_KEY=sk-...

# Google Gemini API Key
GEMINI_API_KEY=...
```

## Error Handling

The service includes comprehensive error handling with specific error codes:

- `INVALID_API_KEY`: API key is invalid or missing
- `RATE_LIMIT_EXCEEDED`: Provider rate limit reached (retryable)
- `NETWORK_ERROR`: Network connectivity issue (retryable)
- `TIMEOUT`: Request exceeded timeout limit (retryable)
- `INVALID_RESPONSE`: Provider returned invalid response
- `CONTENT_FILTER`: Content was filtered by provider
- `INSUFFICIENT_QUOTA`: Account quota exceeded
- `PROVIDER_ERROR`: General provider error
- `PARSING_ERROR`: Failed to parse AI response

## Prompt Parsing

The service automatically extracts requirements from user prompts:

**Word Count Detection:**
- "200 words"
- "150-200 words"
- "approximately 300 words"
- "about 250 words"

**Question Count Detection:**
- "5 questions"
- "answer 3 questions"

**Question Identification:**
- Numbered questions: "1.", "1)", "Q1", "Question 1"
- Questions ending with "?"

## Response Formatting

The AI service formats responses into structured Answer objects:

```typescript
interface Answer {
  questionNumber: number;
  content: string;
  wordCount: number;
}
```

The service expects AI responses in the format:
```
ANSWER 1:
[content]

ANSWER 2:
[content]
```

If this format is not found, it falls back to splitting by double newlines or treating the entire response as a single answer.

## Retry Logic

The service implements exponential backoff for retryable errors:

- Initial delay: 1 second
- Max delay: 10 seconds
- Backoff multiplier: 2x
- Max retries: 3

Example retry sequence: 1s → 2s → 4s

## Testing

To test the AI generation system:

1. Set up environment variables
2. Upload a file to get context
3. Submit a prompt through the PromptInput component
4. The system will call `/api/generate` and return structured answers

## Integration Example

```typescript
'use client';

import { useState } from 'react';
import UploadSection from '@/components/Dashboard/UploadSection';
import PromptInput from '@/components/Dashboard/PromptInput';
import { ExtractedContent } from '@/lib/types/file-processing';
import { Answer } from '@/lib/types/ai-service';

export default function Dashboard() {
  const [content, setContent] = useState<ExtractedContent | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (extractedContent: ExtractedContent) => {
    setContent(extractedContent);
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!content) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: content.text,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnswers(result.data.answers);
      } else {
        console.error('Generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <UploadSection onFileUpload={handleFileUpload} />
      <PromptInput
        onSubmit={handlePromptSubmit}
        uploadedContent={content?.text || null}
        isGenerating={isGenerating}
      />
      {/* Display answers */}
    </div>
  );
}
```
