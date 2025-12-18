/**
 * API route for AI content generation
 * POST /api/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIServiceFromEnv } from '@/lib/services/aiService';
import {
  AIGenerationError,
  AIGenerationErrorCode,
  GenerationRequest,
} from '@/lib/types/ai-service';
import { checkRateLimit } from '@/lib/utils/rateLimit';

/**
 * Request body validation schema
 */
interface GenerateRequestBody {
  prompt: string;
  context: string;
  wordCount?: number;
  questionCount?: number;
}

/**
 * Validate request payload
 */
function validateRequest(body: any): {
  valid: boolean;
  error?: string;
  data?: GenerateRequestBody;
} {
  // Check if body exists
  if (!body) {
    return {
      valid: false,
      error: 'Request body is required',
    };
  }

  // Validate prompt
  if (!body.prompt || typeof body.prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt is required and must be a string',
    };
  }

  if (body.prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty',
    };
  }

  if (body.prompt.length > 5000) {
    return {
      valid: false,
      error: 'Prompt must be 5000 characters or less',
    };
  }

  // Validate context
  if (!body.context || typeof body.context !== 'string') {
    return {
      valid: false,
      error: 'Context is required and must be a string',
    };
  }

  if (body.context.trim().length === 0) {
    return {
      valid: false,
      error: 'Context cannot be empty. Please upload a file first.',
    };
  }

  // Validate optional fields
  if (body.wordCount !== undefined) {
    if (typeof body.wordCount !== 'number' || body.wordCount <= 0) {
      return {
        valid: false,
        error: 'Word count must be a positive number',
      };
    }
  }

  if (body.questionCount !== undefined) {
    if (typeof body.questionCount !== 'number' || body.questionCount <= 0) {
      return {
        valid: false,
        error: 'Question count must be a positive number',
      };
    }
  }

  return {
    valid: true,
    data: {
      prompt: body.prompt.trim(),
      context: body.context.trim(),
      wordCount: body.wordCount,
      questionCount: body.questionCount,
    },
  };
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyErrorMessage(error: AIGenerationError): string {
  switch (error.code) {
    case AIGenerationErrorCode.INVALID_API_KEY:
      return `Invalid API key for ${error.provider}. Please check your configuration.`;

    case AIGenerationErrorCode.RATE_LIMIT_EXCEEDED:
      return `Rate limit exceeded for ${error.provider}. Please try again in a few moments.`;

    case AIGenerationErrorCode.INSUFFICIENT_QUOTA:
      return `Insufficient quota for ${error.provider}. Please check your account.`;

    case AIGenerationErrorCode.TIMEOUT:
      return 'Request timed out. Please try again with a shorter prompt or context.';

    case AIGenerationErrorCode.NETWORK_ERROR:
      return 'Network error occurred. Please check your connection and try again.';

    case AIGenerationErrorCode.INVALID_RESPONSE:
      return 'Received invalid response from AI provider. Please try again.';

    case AIGenerationErrorCode.CONTENT_FILTER:
      return 'Content was filtered by the AI provider. Please modify your prompt.';

    case AIGenerationErrorCode.PARSING_ERROR:
      return 'Failed to parse AI response. Please try again.';

    case AIGenerationErrorCode.PROVIDER_ERROR:
      return `Error from ${error.provider}: ${error.message}`;

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * POST handler for AI generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitCheck = checkRateLimit(request, 'generate');
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response;
    }

    // Parse request body
    const body = await request.json().catch(() => null);

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validation.error,
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    const requestData = validation.data!;

    // Create AI service
    let aiService;
    try {
      aiService = createAIServiceFromEnv();
    } catch (error) {
      if (error instanceof AIGenerationError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: getUserFriendlyErrorMessage(error),
              code: error.code,
              retryable: error.retryable,
            },
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // Generate answers
    const generationRequest: GenerationRequest = {
      prompt: requestData.prompt,
      context: requestData.context,
      wordCount: requestData.wordCount,
      questionCount: requestData.questionCount,
    };

    const response = await aiService.generateAnswers(generationRequest);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          answers: response.answers,
          totalWords: response.totalWords,
          provider: response.provider,
          model: response.model,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI generation error:', error);

    // Handle AIGenerationError
    if (error instanceof AIGenerationError) {
      const statusCode = error.retryable ? 503 : 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            message: getUserFriendlyErrorMessage(error),
            code: error.code,
            retryable: error.retryable,
            provider: error.provider,
          },
        },
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - return method not allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Method not allowed. Use POST to generate content.',
        code: 'METHOD_NOT_ALLOWED',
      },
    },
    { status: 405 }
  );
}
