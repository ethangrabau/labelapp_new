import { validateAndCorrectIngredients } from './ingredientValidator';

export function parseIngredients(text: string): string[] {
  console.log('Initial processed text:', text.toLowerCase());
  
  // Find the ingredients section
  const ingredientsIndex = text.toLowerCase().indexOf('ingredients:');
  if (ingredientsIndex === -1) {
    return [];
  }
  console.log('Found ingredients list starting at index', ingredientsIndex, 'with prefix "ingredients:"');

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
    'may contain'
  ];
  let endIndex = text.length;
  for (let marker of endMarkers) {
    const markerIndex = text.toLowerCase().indexOf(marker, ingredientsIndex + 11);
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

  // Split by commas, but preserve content within parentheses
  const ingredients: string[] = [];
  let currentIngredient = '';
  let insideParentheses = false;
  let parenthesesCount = 0;
  
  for (let i = 0; i < ingredientsSection.length; i++) {
    const char = ingredientsSection[i];
    const nextChar = ingredientsSection[i + 1] || '';
    
    if (char === '(') {
      insideParentheses = true;
      parenthesesCount++;
      currentIngredient += char;
    } else if (char === ')') {
      parenthesesCount--;
      if (parenthesesCount === 0) {
        insideParentheses = false;
      }
      currentIngredient += char;
    } else if (char === ',' && !insideParentheses) {
      // Handle cases where ingredient is just a parenthetical note
      const cleaned = currentIngredient.trim();
      if (cleaned && !/^\([^)]*\)$/.test(cleaned)) {
        ingredients.push(cleaned);
        console.log('Found ingredient:', cleaned);
      }
      currentIngredient = '';
    } else if (char === ' ' && !insideParentheses && /[a-zA-Z]/.test(currentIngredient) && /[A-Z]/.test(nextChar)) {
      // If we see a space followed by a capital letter, treat it as a separator (unless in parentheses)
      const cleaned = currentIngredient.trim();
      if (cleaned && !/^\([^)]*\)$/.test(cleaned)) {
        ingredients.push(cleaned);
        console.log('Found ingredient (by capital letter):', cleaned);
      }
      currentIngredient = '';
    } else {
      currentIngredient += char;
    }
  }
  
  // Add the last ingredient
  const lastIngredient = currentIngredient.trim();
  if (lastIngredient && !/^\([^)]*\)$/.test(lastIngredient)) {
    console.log('Found last ingredient:', lastIngredient);
    ingredients.push(lastIngredient);
  }

  console.log('Raw ingredients before cleaning:', ingredients);

  // Clean and validate each ingredient
  const cleanedIngredients = ingredients
    .map(ingredient => {
      // Handle ingredients with parenthetical information
      let mainIngredient = ingredient;
      let parentheticalInfo = '';
      
      const matches = ingredient.match(/^([^(]+)\s*(\([^)]+\))?$/);
      if (matches) {
        mainIngredient = matches[1].trim();
        parentheticalInfo = matches[2] || '';
      }

      // Special handling for ingredients with descriptive parentheses
      if (parentheticalInfo) {
        // Remove parentheses
        const description = parentheticalInfo.replace(/[()]/g, '').trim();
        
        // Cases where the parenthetical content is the actual ingredient
        const descriptiveTerms = ['emulsifier', 'emulsifler', 'emulsifiers', 'preservative', 'preservatives', 'antioxidant', 'antioxidants', 'stabilizer', 'stabilizers', 'thickener', 'thickeners', 'color', 'colours', 'flavoring', 'flavourings'];
        
        const mainLower = mainIngredient.toLowerCase();
        if (descriptiveTerms.some(term => mainLower.includes(term))) {
          // For terms like "emulsifier (sunflower lecithin)", use "Sunflower Lecithin (Emulsifier)"
          mainIngredient = description + ' (' + mainIngredient + ')';
        } else {
          // For other cases like "sugar (organic)", keep both parts
          mainIngredient = mainIngredient + ' ' + parentheticalInfo;
        }
      }

      // Remove any text after a period that's not inside parentheses
      let periodIndex = -1;
      let insideParens = false;
      
      for (let i = 0; i < mainIngredient.length; i++) {
        if (mainIngredient[i] === '(') insideParens = true;
        else if (mainIngredient[i] === ')') insideParens = false;
        else if (mainIngredient[i] === '.' && !insideParens) {
          periodIndex = i;
          break;
        }
      }
      
      if (periodIndex !== -1) {
        mainIngredient = mainIngredient.substring(0, periodIndex);
      }
      
      mainIngredient = mainIngredient.trim();
      
      // Fix common OCR errors
      mainIngredient = mainIngredient
        .replace(/emulsifler/gi, 'emulsifier')
        .replace(/\bsuger\b/gi, 'sugar')
        .replace(/\bcocoamass\b/gi, 'cocoa mass');
      
      // Normalize capitalization
      mainIngredient = mainIngredient
        .toLowerCase()
        .split(' ')
        .map(word => {
          // Don't capitalize words in parentheses or minor words
          if (word.startsWith('(')) return '(' + word.slice(1);
          const minorWords = ['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
          return minorWords.includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
      
      // Capitalize the first letter of the entire ingredient
      mainIngredient = mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1);
      
      console.log('Cleaned "' + ingredient + '" to "' + mainIngredient + '"');
      return mainIngredient;
    })
    .filter(ingredient => {
      // Filter out invalid ingredients and percentage information
      if (
        ingredient.length < 2 || 
        /^\d+$/.test(ingredient) ||
        /\d+%/.test(ingredient) ||
        ingredient.toLowerCase().includes('contains') ||
        ingredient.toLowerCase().includes('minimum')
      ) {
        console.log('Filtered out "' + ingredient + '" because it\'s invalid');
        return false;
      }
      return true;
    });

  console.log('Final cleaned ingredients:', cleanedIngredients);
  return cleanedIngredients;
}
