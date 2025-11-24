/**
 * AI Service for content generation using OpenAI or Gemini
 */

import {
  AIProvider,
  AIServiceConfig,
  GenerationRequest,
  GenerationResponse,
  Answer,
  ParsedPrompt,
  AIGenerationError,
  AIGenerationErrorCode,
  RetryConfig,
} from '@/lib/types/ai-service';

/**
 * Default retry configuration with exponential backoff
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * AI Service class with provider abstraction
 */
export class AIService {
  private config: AIServiceConfig;
  private retryConfig: RetryConfig;

  constructor(config: AIServiceConfig, retryConfig?: Partial<RetryConfig>) {
    this.config = {
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      ...config,
    };
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig,
    };
  }

  /**
   * Generate answers based on prompt and context
   */
  async generateAnswers(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    // Parse the prompt to extract requirements
    const parsedPrompt = this.parsePrompt(request.prompt);

    // Build the full prompt with context
    const fullPrompt = this.buildFullPrompt(request, parsedPrompt);

    // Call the appropriate provider with retry logic
    const rawResponse = await this.callProviderWithRetry(fullPrompt);

    // Format the response into structured answers
    const answers = this.formatResponse(rawResponse, parsedPrompt);

    // Calculate total word count
    const totalWords = answers.reduce(
      (sum, answer) => sum + answer.wordCount,
      0
    );

    return {
      answers,
      totalWords,
      provider: this.config.provider,
      model: this.config.model || this.getDefaultModel(),
    };
  }

  /**
   * Parse prompt to extract word count and question requirements
   */
  private parsePrompt(prompt: string): ParsedPrompt {
    const parsed: ParsedPrompt = {
      originalPrompt: prompt,
      questions: [],
    };

    // Extract word count (e.g., "200 words", "150-200 words", "approximately 300 words")
    const wordCountPatterns = [
      /(\d+)\s*-?\s*(\d+)?\s*words?/gi,
      /approximately\s+(\d+)\s*words?/gi,
      /about\s+(\d+)\s*words?/gi,
      /around\s+(\d+)\s*words?/gi,
    ];

    for (const pattern of wordCountPatterns) {
      const match = pattern.exec(prompt);
      if (match) {
        // If range (e.g., "150-200"), use the average
        if (match[2]) {
          parsed.wordCount = Math.floor(
            (parseInt(match[1]) + parseInt(match[2])) / 2
          );
        } else {
          parsed.wordCount = parseInt(match[1]);
        }
        break;
      }
    }

    // Extract question count (e.g., "5 questions", "answer 3 questions")
    const questionCountPattern = /(\d+)\s*questions?/gi;
    const questionMatch = questionCountPattern.exec(prompt);
    if (questionMatch) {
      parsed.questionCount = parseInt(questionMatch[1]);
    }

    // Try to identify individual questions (numbered or with question marks)
    const lines = prompt.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered questions (1., 1), Q1, Question 1, etc.)
      if (
        /^(\d+[\.\)]|Q\d+|Question\s+\d+)/i.test(trimmed) ||
        trimmed.endsWith('?')
      ) {
        parsed.questions.push(trimmed);
      }
    }

    // If no explicit question count but we found questions, use that count
    if (!parsed.questionCount && parsed.questions.length > 0) {
      parsed.questionCount = parsed.questions.length;
    }

    return parsed;
  }

  /**
   * Build full prompt with context and instructions
   */
  private buildFullPrompt(
    request: GenerationRequest,
    parsed: ParsedPrompt
  ): string {
    const parts: string[] = [];

    // System instructions
    parts.push(
      'You are an AI assistant helping students generate assignment answers.'
    );
    parts.push(
      'Generate clear, well-structured answers based on the provided context and requirements.'
    );

    // Add context
    if (request.context) {
      parts.push('\n--- CONTEXT FROM UPLOADED FILE ---');
      parts.push(request.context);
      parts.push('--- END CONTEXT ---\n');
    }

    // Add user prompt
    parts.push('--- USER REQUIREMENTS ---');
    parts.push(request.prompt);
    parts.push('--- END REQUIREMENTS ---\n');

    // Add formatting instructions
    parts.push('--- OUTPUT FORMAT ---');
    parts.push(
      'Please format your response as follows:'
    );
    parts.push('- Start each answer with "ANSWER [number]:"');
    parts.push('- Separate answers with a blank line');
    parts.push('- Write in clear, academic language');
    
    if (parsed.wordCount) {
      parts.push(
        `- Each answer should be approximately ${parsed.wordCount} words (±10%)`
      );
    }
    
    if (parsed.questionCount) {
      parts.push(`- Provide exactly ${parsed.questionCount} answers`);
    }

    parts.push('--- END FORMAT ---');

    return parts.join('\n');
  }

  /**
   * Call AI provider with retry logic and exponential backoff
   */
  private async callProviderWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retrying
          await this.sleep(delay);
          delay = Math.min(
            delay * this.retryConfig.backoffMultiplier,
            this.retryConfig.maxDelay
          );
        }

        // Call the appropriate provider
        if (this.config.provider === 'openai') {
          return await this.callOpenAI(prompt);
        } else if (this.config.provider === 'gemini') {
          return await this.callGemini(prompt);
        } else {
          throw new AIGenerationError(
            `Unsupported provider: ${this.config.provider}`,
            false,
            AIGenerationErrorCode.PROVIDER_ERROR,
            this.config.provider
          );
        }
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (error instanceof AIGenerationError && !error.retryable) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        console.warn(
          `AI generation attempt ${attempt + 1} failed, retrying...`,
          error
        );
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('AI generation failed after all retries');
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const model = this.config.model || 'gpt-4o-mini';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new AIGenerationError(
            'Invalid OpenAI API key',
            false,
            AIGenerationErrorCode.INVALID_API_KEY,
            'openai'
          );
        } else if (response.status === 429) {
          throw new AIGenerationError(
            'OpenAI rate limit exceeded',
            true,
            AIGenerationErrorCode.RATE_LIMIT_EXCEEDED,
            'openai'
          );
        } else if (response.status === 402) {
          throw new AIGenerationError(
            'Insufficient OpenAI quota',
            false,
            AIGenerationErrorCode.INSUFFICIENT_QUOTA,
            'openai'
          );
        }

        throw new AIGenerationError(
          errorData.error?.message || `OpenAI API error: ${response.status}`,
          response.status >= 500,
          AIGenerationErrorCode.PROVIDER_ERROR,
          'openai'
        );
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AIGenerationError(
          'Invalid response from OpenAI',
          false,
          AIGenerationErrorCode.INVALID_RESPONSE,
          'openai'
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIGenerationError(
          'OpenAI request timeout',
          true,
          AIGenerationErrorCode.TIMEOUT,
          'openai',
          error
        );
      }

      throw new AIGenerationError(
        'Network error calling OpenAI',
        true,
        AIGenerationErrorCode.NETWORK_ERROR,
        'openai',
        error as Error
      );
    }
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(prompt: string): Promise<string> {
    const model = this.config.model || 'gemini-1.5-flash';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          throw new AIGenerationError(
            'Invalid Gemini API key',
            false,
            AIGenerationErrorCode.INVALID_API_KEY,
            'gemini'
          );
        } else if (response.status === 429) {
          throw new AIGenerationError(
            'Gemini rate limit exceeded',
            true,
            AIGenerationErrorCode.RATE_LIMIT_EXCEEDED,
            'gemini'
          );
        }

        throw new AIGenerationError(
          errorData.error?.message || `Gemini API error: ${response.status}`,
          response.status >= 500,
          AIGenerationErrorCode.PROVIDER_ERROR,
          'gemini'
        );
      }

      const data = await response.json();
      
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        throw new AIGenerationError(
          'Invalid response from Gemini',
          false,
          AIGenerationErrorCode.INVALID_RESPONSE,
          'gemini'
        );
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error instanceof AIGenerationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIGenerationError(
          'Gemini request timeout',
          true,
          AIGenerationErrorCode.TIMEOUT,
          'gemini',
          error
        );
      }

      throw new AIGenerationError(
        'Network error calling Gemini',
        true,
        AIGenerationErrorCode.NETWORK_ERROR,
        'gemini',
        error as Error
      );
    }
  }

  /**
   * Format AI response into structured Answer objects
   */
  private formatResponse(
    rawResponse: string,
    parsed: ParsedPrompt
  ): Answer[] {
    const answers: Answer[] = [];

    try {
      // Split by "ANSWER" markers
      const answerPattern = /ANSWER\s+(\d+):\s*/gi;
      const parts = rawResponse.split(answerPattern);

      // parts[0] is text before first ANSWER, then alternating numbers and content
      for (let i = 1; i < parts.length; i += 2) {
        const questionNumber = parseInt(parts[i]);
        const content = parts[i + 1]?.trim() || '';

        if (content) {
          const wordCount = this.countWords(content);
          answers.push({
            questionNumber,
            content,
            wordCount,
          });
        }
      }

      // If no ANSWER markers found, try to split by double newlines or numbered patterns
      if (answers.length === 0) {
        const sections = rawResponse
          .split(/\n\n+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        sections.forEach((section, index) => {
          // Remove leading numbers or question markers
          const content = section.replace(/^(\d+[\.\)]|Q\d+\.?)\s*/i, '').trim();
          
          if (content) {
            const wordCount = this.countWords(content);
            answers.push({
              questionNumber: index + 1,
              content,
              wordCount,
            });
          }
        });
      }

      // If still no answers, treat entire response as one answer
      if (answers.length === 0 && rawResponse.trim()) {
        answers.push({
          questionNumber: 1,
          content: rawResponse.trim(),
          wordCount: this.countWords(rawResponse),
        });
      }

      return answers;
    } catch (error) {
      throw new AIGenerationError(
        'Failed to parse AI response',
        false,
        AIGenerationErrorCode.PARSING_ERROR,
        this.config.provider,
        error as Error
      );
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(): string {
    return this.config.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash';
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create AI service instance from environment variables
 */
export function createAIServiceFromEnv(): AIService {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai') as AIProvider;
  
  const apiKey =
    provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIGenerationError(
      `API key not configured for provider: ${provider}`,
      false,
      AIGenerationErrorCode.INVALID_API_KEY,
      provider
    );
  }

  return new AIService({
    provider,
    apiKey,
  });
}
