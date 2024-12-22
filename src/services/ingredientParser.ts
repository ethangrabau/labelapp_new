import { validateAndCorrectIngredients } from './ingredientValidator';

export function parseIngredients(text: string): string[] {
  console.log('Initial processed text:', text.toLowerCase());
  
  // Find the ingredients section with more variations
  const textLower = text.toLowerCase();
  const possibleStarts = [
    'ingredients:', 
    'ingredients', 
    'contains:', 
    'contains'
  ];
  
  let ingredientsIndex = -1;
  for (const start of possibleStarts) {
    const index = textLower.indexOf(start);
    if (index !== -1) {
      ingredientsIndex = index;
      console.log(`Found ingredients list starting at index ${index} with prefix "${start}"`);
      break;
    }
  }
  
  if (ingredientsIndex === -1) {
    console.log('No ingredients section found, trying to parse whole text');
    // If no ingredients section found, try to parse the whole text
    return text
      .split(/[,.]/)
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);
  }

  // Find the end of the ingredients section
  let endMarkers = [
    'allergy advice', 
    'storage:', 
    'contains:', 
    'nutrition',
    'dark chocolate contains',
    'milk chocolate contains',
    'white chocolate contains',
    'minimum',
    'may contain',
    'manufactured'
  ];
  let endIndex = text.length;
  for (let marker of endMarkers) {
    const markerIndex = textLower.indexOf(marker, ingredientsIndex + 11);
    if (markerIndex !== -1 && markerIndex < endIndex) {
      endIndex = markerIndex;
      console.log('Found end marker "' + marker + '" at index', markerIndex);
    }
  }

  // Extract the ingredients section and clean up line breaks
  let ingredientsSection = text
    .substring(ingredientsIndex + 11, endIndex)
    .replace(/\n/g, ' ')  // Replace line breaks with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  console.log('Extracted ingredients section:', ingredientsSection);

  // Split by commas and periods
  const ingredients = ingredientsSection
    .split(/[,.]/)
    .map(ingredient => ingredient.trim())
    .filter(ingredient => ingredient.length > 0);

  console.log('Parsed ingredients:', ingredients);
  
  return ingredients;
}
