import { GEMINI_API_KEY } from '../config/environment';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface IngredientAnalysis {
  name: string;
  safety: 'safe' | 'questionable' | 'warning';
  explanation: string;
  sources: Array<{ title: string; url: string; }>;
}

async function makeGeminiRequest(prompt: string): Promise<string> {
  try {
    console.log('Making Gemini request with API key:', GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('Request URL:', API_URL);
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API request failed:', error);
    throw error;
  }
}

const SYSTEM_PROMPT = `Analyze the following ingredients and return a JSON response in this exact format:
{
  "ingredients": [
    {
      "name": "ingredient name",
      "safety": "safe",
      "explanation": "brief scientific explanation of safety assessment",
      "sources": [
        {
          "title": "FDA Database",
          "url": "https://www.fda.gov"
        }
      ]
    }
  ]
}

For each ingredient:
1. Rate safety as either "safe", "questionable", or "warning"
2. Provide a brief scientific explanation
3. Include at least one reliable source (FDA, scientific papers, etc.)

Return ONLY the JSON response, no additional text.`;

export async function analyzeIngredientWithGemini(ingredient: string): Promise<IngredientAnalysis> {
  try {
    console.log('Analyzing ingredient:', ingredient);
    
    const prompt = `${SYSTEM_PROMPT}\n\nIngredient to analyze: "${ingredient}"`;
    const responseText = await makeGeminiRequest(prompt);
    console.log('Raw API response text:', responseText);
    
    try {
      // Try to find a JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('Parsed response:', parsedResponse);
      
      if (!parsedResponse.ingredients?.[0]) {
        throw new Error('Invalid response format: missing ingredients array or first ingredient');
      }
      
      return parsedResponse.ingredients[0];
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('Failed to parse ingredient analysis results');
    }
  } catch (error) {
    console.error('Ingredient analysis error:', error);
    return {
      name: ingredient,
      safety: 'questionable',
      explanation: 'Unable to analyze this ingredient at the moment.',
      sources: [{
        title: 'Analysis Unavailable',
        url: 'https://example.com'
      }]
    };
  }
}

export async function analyzeIngredientsWithGemini(ingredients: string[]): Promise<IngredientAnalysis[]> {
  console.log('Analyzing ingredients:', ingredients);
  
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nIngredients to analyze:\n${ingredients.join('\n')}`;
    const responseText = await makeGeminiRequest(prompt);
    console.log('Raw API response text:', responseText);
    
    try {
      // Try to find a JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('Parsed response:', parsedResponse);
      
      if (!Array.isArray(parsedResponse.ingredients)) {
        throw new Error('Invalid response format: ingredients is not an array');
      }
      
      return parsedResponse.ingredients;
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('Failed to parse ingredients analysis results');
    }
  } catch (error) {
    console.error('Ingredients analysis error:', error);
    // Return a fallback response for each ingredient
    return ingredients.map(ingredient => ({
      name: ingredient,
      safety: 'questionable',
      explanation: 'Unable to analyze this ingredient at the moment.',
      sources: [{
        title: 'Analysis Unavailable',
        url: 'https://example.com'
      }]
    }));
  }
}
