import type { NativeStackScreenProps } from '@react-navigation/native-stack';

interface IngredientAnalysis {
  name: string;
  safety: 'safe' | 'questionable' | 'warning';
  explanation: string;
  sources: Array<{ title: string; url: string; }>;
}

export type RootStackParamList = {
  Scan: undefined;
  Analysis: {
    scannedText: string;
    directAnalysisResults: IngredientAnalysis[] | null;
  };
  Details: {
    ingredientName: string;
    safetyInfo: IngredientSafetyInfo;
  };
};

export type IngredientSafetyRating = 'safe' | 'questionable' | 'warning';

export interface IngredientSafetyInfo {
  rating: IngredientSafetyRating;
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

export interface AnalysisResult {
  ingredients: Array<{
    name: string;
    safety: IngredientSafetyInfo;
  }>;
  overallRating: IngredientSafetyRating;
  summary: string;
}

export type ScanScreenProps = NativeStackScreenProps<RootStackParamList, 'Scan'>;
export type AnalysisScreenProps = NativeStackScreenProps<RootStackParamList, 'Analysis'>;
export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;
