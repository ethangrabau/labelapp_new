import { GEMINI_API_KEY } from '../config/environment';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

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

    console.log('Response status:', response.status);
    
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
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

const SYSTEM_PROMPT = `You are an expert in food ingredients analysis. Your task is to:
1. Identify ingredients from potentially imperfect OCR text
2. Flag any concerning ingredients
3. Provide a brief analysis

Important OCR Handling Guidelines:
- Look for common OCR mistakes (e.g., 'cocod' likely means 'cocoa')
- Consider context when interpreting ingredients
- If an ingredient is ambiguous, try to infer from context or list it as "unclear"
- Ignore any stray punctuation or formatting issues

Response Format:
{
  "ingredients": ["list", "of", "cleaned", "ingredients"],
  "concerns": ["any", "concerning", "ingredients"],
  "analysis": "brief analysis focusing on health implications"
}`;

export async function analyzeIngredientWithGemini(ingredient: string): Promise<IngredientAnalysis> {
  try {
    console.log('Analyzing ingredient:', ingredient);
    
    const prompt = `
${SYSTEM_PROMPT}

Ingredient to analyze: "${ingredient}"

Please analyze this ingredient, considering possible OCR errors and provide your response in the specified JSON format.`;

    const text = await makeGeminiRequest(prompt);
    console.log('Raw API response text:', text);
    
    try {
      // Find the JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Parsed analysis:', analysis);
      
      // Validate the response format
      if (!analysis.ingredients || !analysis.concerns || !analysis.analysis) {
        throw new Error('Invalid response format from API');
      }
      
      return {
        name: ingredient,
        safety: analysis.concerns.length > 0 ? 'questionable' : 'safe',
        explanation: analysis.analysis,
        sources: [{
          title: 'Gemini Analysis',
          url: 'https://example.com'
        }]
      };
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Ingredient analysis error:', error);
    // Return a fallback response
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
  
  // Analyze ingredients in parallel with a concurrency limit
  const concurrencyLimit = 3;
  const results: IngredientAnalysis[] = [];
  
  for (let i = 0; i < ingredients.length; i += concurrencyLimit) {
    const batch = ingredients.slice(i, i + concurrencyLimit);
    console.log(`Processing batch ${i / concurrencyLimit + 1}:`, batch);
    
    const batchResults = await Promise.all(
      batch.map(ingredient => analyzeIngredientWithGemini(ingredient))
    );
    results.push(...batchResults);
  }
  
  console.log('Analysis complete. Results:', results);
  return results;
}
