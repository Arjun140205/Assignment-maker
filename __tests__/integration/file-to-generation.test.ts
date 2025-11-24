import { describe, it, expect, beforeEach } from 'vitest';
import { FileProcessor } from '@/lib/services/fileProcessor';
import { AIService } from '@/lib/services/aiService';

describe('File Upload to AI Generation Flow', () => {
  let fileProcessor: FileProcessor;
  let aiService: AIService;

  beforeEach(() => {
    fileProcessor = new FileProcessor();
    
    // Use environment variables for AI service
    const apiKey = process.env.OPENAI_API_KEY || '';
    aiService = new AIService({
      provider: 'openai',
      apiKey,
      timeout: 30000,
    });
  });

  it.skip('should process text file and generate answers', async () => {
    // Create a test file
    const content = 'This is test content about artificial intelligence and machine learning.';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    // Step 1: Process file
    const extracted = await fileProcessor.processFile(file);
    
    expect(extracted.text).toBe(content);
    expect(extracted.metadata.fileName).toBe('test.txt');

    // Step 2: Generate answers using extracted content
    const response = await aiService.generateAnswers({
      prompt: 'Write 2 short answers about the topic in the context.',
      context: extracted.text,
    });

    expect(response.answers).toBeDefined();
    expect(response.answers.length).toBeGreaterThan(0);
    expect(response.totalWords).toBeGreaterThan(0);
    expect(response.provider).toBe('openai');
  }, 60000); // 60 second timeout for API call
});
