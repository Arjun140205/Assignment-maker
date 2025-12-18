/**
 * Curated list of authentic handwritten fonts
 * Organized by category with more realistic handwriting styles
 */

import { HandwrittenFont } from '../types/canvas';

// Font categories for better organization
export type FontCategory = 'natural' | 'casual' | 'neat' | 'formal' | 'artistic';

export interface CategorizedFont extends HandwrittenFont {
  category: FontCategory;
  description: string;
}

/**
 * Curated collection of the most realistic handwritten fonts
 * These fonts are specifically chosen to look like actual human handwriting
 */
export const HANDWRITTEN_FONTS: CategorizedFont[] = [
  // === NATURAL HANDWRITING (Most realistic, everyday writing) ===
  {
    id: 'homemade-apple',
    name: 'Homemade Apple',
    family: 'Homemade Apple',
    url: 'https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'natural',
    description: 'Natural, slightly messy everyday handwriting',
  },
  {
    id: 'nothing-you-could-do',
    name: 'Nothing You Could Do',
    family: 'Nothing You Could Do',
    url: 'https://fonts.googleapis.com/css2?family=Nothing+You+Could+Do&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'natural',
    description: 'Casual handwritten notes style',
  },
  {
    id: 'la-belle-aurore',
    name: 'La Belle Aurore',
    family: 'La Belle Aurore',
    url: 'https://fonts.googleapis.com/css2?family=La+Belle+Aurore&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'natural',
    description: 'Elegant everyday handwriting',
  },
  {
    id: 'cedarville-cursive',
    name: 'Cedarville Cursive',
    family: 'Cedarville Cursive',
    url: 'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'natural',
    description: 'Natural cursive handwriting',
  },
  {
    id: 'dawning-of-a-new-day',
    name: 'Dawning of a New Day',
    family: 'Dawning of a New Day',
    url: 'https://fonts.googleapis.com/css2?family=Dawning+of+a+New+Day&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'natural',
    description: 'Light, airy everyday handwriting',
  },

  // === CASUAL HANDWRITING (Relaxed, student-like) ===
  {
    id: 'caveat',
    name: 'Caveat',
    family: 'Caveat',
    url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Casual brush-style handwriting',
  },
  {
    id: 'kalam',
    name: 'Kalam',
    family: 'Kalam',
    url: 'https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Relaxed handwritten style with pen feel',
  },
  {
    id: 'indie-flower',
    name: 'Indie Flower',
    family: 'Indie Flower',
    url: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Fun, casual handwriting',
  },
  {
    id: 'shadows-into-light',
    name: 'Shadows Into Light',
    family: 'Shadows Into Light',
    url: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Light, flowing handwriting',
  },
  {
    id: 'patrick-hand',
    name: 'Patrick Hand',
    family: 'Patrick Hand',
    url: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Friendly casual handwriting',
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon',
    family: 'Coming Soon',
    url: 'https://fonts.googleapis.com/css2?family=Coming+Soon&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'casual',
    description: 'Quirky casual handwriting',
  },

  // === NEAT HANDWRITING (Careful, clear writing) ===
  {
    id: 'handlee',
    name: 'Handlee',
    family: 'Handlee',
    url: 'https://fonts.googleapis.com/css2?family=Handlee&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Neat, legible handwriting',
  },
  {
    id: 'architects-daughter',
    name: 'Architects Daughter',
    family: 'Architects Daughter',
    url: 'https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Clean technical handwriting',
  },
  {
    id: 'annie-use-your-telescope',
    name: 'Annie Use Your Telescope',
    family: 'Annie Use Your Telescope',
    url: 'https://fonts.googleapis.com/css2?family=Annie+Use+Your+Telescope&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Clear, readable handwriting',
  },
  {
    id: 'neucha',
    name: 'Neucha',
    family: 'Neucha',
    url: 'https://fonts.googleapis.com/css2?family=Neucha&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Clean handwriting with slight tilt',
  },
  {
    id: 'mali',
    name: 'Mali',
    family: 'Mali',
    url: 'https://fonts.googleapis.com/css2?family=Mali:wght@300;400;500;600&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Neat rounded handwriting',
  },
  {
    id: 'nanum-pen-script',
    name: 'Nanum Pen Script',
    family: 'Nanum Pen Script',
    url: 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'neat',
    description: 'Careful pen handwriting',
  },

  // === FORMAL HANDWRITING (More refined, elegant) ===
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: 'Dancing Script',
    url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'formal',
    description: 'Elegant flowing script',
  },
  {
    id: 'sacramento',
    name: 'Sacramento',
    family: 'Sacramento',
    url: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'formal',
    description: 'Refined brush script',
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes',
    family: 'Great Vibes',
    url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'formal',
    description: 'Elegant calligraphic style',
  },
  {
    id: 'satisfy',
    name: 'Satisfy',
    family: 'Satisfy',
    url: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'formal',
    description: 'Smooth flowing script',
  },

  // === ARTISTIC HANDWRITING (Unique, character-full) ===
  {
    id: 'reenie-beanie',
    name: 'Reenie Beanie',
    family: 'Reenie Beanie',
    url: 'https://fonts.googleapis.com/css2?family=Reenie+Beanie&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Thin expressive handwriting',
  },
  {
    id: 'rock-salt',
    name: 'Rock Salt',
    family: 'Rock Salt',
    url: 'https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Bold textured handwriting',
  },
  {
    id: 'covered-by-your-grace',
    name: 'Covered By Your Grace',
    family: 'Covered By Your Grace',
    url: 'https://fonts.googleapis.com/css2?family=Covered+By+Your+Grace&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Artistic flowing style',
  },
  {
    id: 'gloria-hallelujah',
    name: 'Gloria Hallelujah',
    family: 'Gloria Hallelujah',
    url: 'https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Expressive comic-like style',
  },
  {
    id: 'just-another-hand',
    name: 'Just Another Hand',
    family: 'Just Another Hand',
    url: 'https://fonts.googleapis.com/css2?family=Just+Another+Hand&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Tall artistic handwriting',
  },
  {
    id: 'bad-script',
    name: 'Bad Script',
    family: 'Bad Script',
    url: 'https://fonts.googleapis.com/css2?family=Bad+Script&display=swap',
    preview: 'The quick brown fox jumps over the lazy dog',
    category: 'artistic',
    description: 'Deliberately imperfect style',
  },
];

/**
 * Get fonts by category
 */
export function getFontsByCategory(category: FontCategory): CategorizedFont[] {
  return HANDWRITTEN_FONTS.filter(font => font.category === category);
}

/**
 * Get all font categories with counts
 */
export function getFontCategories(): { category: FontCategory; count: number; label: string }[] {
  return [
    { category: 'natural', count: getFontsByCategory('natural').length, label: 'Natural' },
    { category: 'casual', count: getFontsByCategory('casual').length, label: 'Casual' },
    { category: 'neat', count: getFontsByCategory('neat').length, label: 'Neat' },
    { category: 'formal', count: getFontsByCategory('formal').length, label: 'Formal' },
    { category: 'artistic', count: getFontsByCategory('artistic').length, label: 'Artistic' },
  ];
}

/**
 * Default font - Homemade Apple (most natural looking)
 */
export const DEFAULT_FONT: CategorizedFont = HANDWRITTEN_FONTS[0]; // Homemade Apple

/**
 * Recommended fonts for assignments (most realistic)
 */
export const RECOMMENDED_FONTS: CategorizedFont[] = [
  HANDWRITTEN_FONTS.find(f => f.id === 'homemade-apple')!,
  HANDWRITTEN_FONTS.find(f => f.id === 'nothing-you-could-do')!,
  HANDWRITTEN_FONTS.find(f => f.id === 'kalam')!,
  HANDWRITTEN_FONTS.find(f => f.id === 'caveat')!,
  HANDWRITTEN_FONTS.find(f => f.id === 'handlee')!,
];
