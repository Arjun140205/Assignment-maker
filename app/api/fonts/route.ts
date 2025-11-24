/**
 * API route for font management
 * Serves font list and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { HANDWRITTEN_FONTS, DEFAULT_FONT } from '@/lib/data/handwritten-fonts';
import { HandwrittenFont } from '@/lib/types/canvas';

/**
 * GET /api/fonts
 * Returns list of all available handwritten fonts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let fonts: HandwrittenFont[] = HANDWRITTEN_FONTS;

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      fonts = fonts.filter(font => 
        font.name.toLowerCase().includes(lowerQuery) ||
        font.family.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply pagination
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : fonts.length;
    
    const paginatedFonts = fonts.slice(offsetNum, offsetNum + limitNum);

    return NextResponse.json({
      success: true,
      data: {
        fonts: paginatedFonts,
        total: fonts.length,
        offset: offsetNum,
        limit: limitNum,
        defaultFont: DEFAULT_FONT
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    });
  } catch (error) {
    console.error('Error fetching fonts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fonts'
    }, { status: 500 });
  }
}

/**
 * POST /api/fonts/preview
 * Generate preview for a specific font
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fontId, text } = body;

    if (!fontId) {
      return NextResponse.json({
        success: false,
        error: 'Font ID is required'
      }, { status: 400 });
    }

    // Find the font
    const font = HANDWRITTEN_FONTS.find(f => f.id === fontId);

    if (!font) {
      return NextResponse.json({
        success: false,
        error: 'Font not found'
      }, { status: 404 });
    }

    // Return font with preview text
    return NextResponse.json({
      success: true,
      data: {
        font,
        previewText: text || font.preview
      }
    });
  } catch (error) {
    console.error('Error generating font preview:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate font preview'
    }, { status: 500 });
  }
}
