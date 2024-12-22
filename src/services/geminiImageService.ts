import { GEMINI_API_KEY } from '../config/environment';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

interface IngredientAnalysis {
  name: string;
  safety: 'safe' | 'questionable' | 'warning';
  explanation: string;
  sources: Array<{ title: string; url: string; }>;
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `Analyze this food ingredient label image and provide a detailed analysis in the following JSON format. Be sure to return ONLY valid JSON:

{
  "ingredients": [
    {
      "name": "ingredient name",
      "safety": "safe",
      "explanation": "brief explanation of safety assessment",
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
1. Extract the name exactly as shown
2. Rate safety as "safe", "questionable", or "warning"
3. Provide a brief scientific explanation
4. Include reliable sources`;

async function imageToBase64(imagePath: string): Promise<string> {
  try {
    // For Android, we need to remove the file:// prefix
    const path = Platform.OS === 'android' ? imagePath.replace('file://', '') : imagePath;
    const imageData = await RNFS.readFile(path, 'base64');
    return imageData;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export async function analyzeImageWithGemini(imagePath: string): Promise<IngredientAnalysis[]> {
  try {
    console.log('Converting image to base64...');
    const base64Image = await imageToBase64(imagePath);
    
    console.log('Making Gemini Vision API request...');
    const requestBody = {
      contents: [{
        parts: [
          {
            text: SYSTEM_PROMPT
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }]
    };

    console.log('Request URL:', API_URL);
    console.log('Request body structure:', {
      ...requestBody,
      contents: [{
        ...requestBody.contents[0],
        parts: requestBody.contents[0].parts.map(part => 
          'inline_data' in part 
            ? { ...part, inline_data: { ...part.inline_data, data: '[BASE64_DATA]' } }
            : part
        )
      }]
    });

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
      console.error('Gemini Vision API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini Vision API raw response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Gemini Vision API');
    }

    // Extract the response text
    const responseText = data.candidates[0].content.parts[0].text;
    console.log('Response text:', responseText);

    // Try to find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      throw new Error('No JSON found in Gemini response');
    }

    try {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('Parsed response:', parsedResponse);
      
      if (!parsedResponse.ingredients || !Array.isArray(parsedResponse.ingredients)) {
        console.error('Invalid ingredients array in response');
        throw new Error('Invalid ingredients array in response');
      }

      return parsedResponse.ingredients;
    } catch (error) {
      console.error('Error parsing Gemini response as JSON:', error);
      throw new Error('Invalid JSON format in Gemini response');
    }
  } catch (error) {
    console.error('Error in analyzeImageWithGemini:', error);
    throw error;
  }
}
