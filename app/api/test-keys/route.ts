/**
 * Test endpoint to verify API keys are configured
 * GET /api/test-keys
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const keys = {
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    provider: process.env.NEXT_PUBLIC_AI_PROVIDER,
  };

  // Show first/last 4 chars of each key for verification
  const keyPreviews = {
    gemini: process.env.GEMINI_API_KEY 
      ? `${process.env.GEMINI_API_KEY.slice(0, 4)}...${process.env.GEMINI_API_KEY.slice(-4)}`
      : 'Not set',
    openrouter: process.env.OPENROUTER_API_KEY
      ? `${process.env.OPENROUTER_API_KEY.slice(0, 4)}...${process.env.OPENROUTER_API_KEY.slice(-4)}`
      : 'Not set',
    openai: process.env.OPENAI_API_KEY
      ? `${process.env.OPENAI_API_KEY.slice(0, 4)}...${process.env.OPENAI_API_KEY.slice(-4)}`
      : 'Not set',
  };

  return NextResponse.json({
    configured: keys,
    previews: keyPreviews,
    fallbackChain: [
      { provider: 'gemini', model: 'gemini-2.0-flash', configured: keys.gemini },
      { provider: 'openrouter', model: 'google/gemini-flash-1.5', configured: keys.openrouter },
      { provider: 'openai', model: 'gpt-3.5-turbo', configured: keys.openai },
    ],
    status: 'All providers configured and ready!',
  });
}
