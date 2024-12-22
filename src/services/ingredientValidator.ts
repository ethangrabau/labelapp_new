import { analyzeWithGeminiVision } from './geminiService';

const commonIngredients = new Set([
  'cocoa mass',
  'cocoa butter',
  'sugar',
  'water',
  'aqua',
  'glycerin',
  'sodium',
  'acid',
  // Add more common ingredients
]);

export interface ValidationResult {
  isValid: boolean;
  suggestedCorrection?: string;
  confidence: number;
}

export const validateIngredient = (ingredient: string): ValidationResult => {
  // Remove special characters and normalize
  const normalized = ingredient.toLowerCase().trim();
  
  // Direct match with common ingredients
  if (commonIngredients.has(normalized)) {
    return { isValid: true, confidence: 1.0 };
  }

  // Check for close matches using Levenshtein distance
  for (const common of commonIngredients) {
    const distance = levenshteinDistance(normalized, common);
    const similarity = 1 - (distance / Math.max(normalized.length, common.length));
    
    if (similarity > 0.8) {
      return {
        isValid: false,
        suggestedCorrection: common,
        confidence: similarity
      };
    }
  }

  return { isValid: true, confidence: 0.5 };
};

// Helper function to calculate Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export const validateAndCorrectIngredients = (ingredients: string[]): string[] => {
  return ingredients;
};
