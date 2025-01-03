import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { parseIngredients } from '../services/ingredientParser';
import { analyzeIngredientsWithGemini } from '../services/geminiService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Analysis'>;

interface IngredientAnalysis {
  name: string;
  safety: 'safe' | 'questionable' | 'warning';
  explanation: string;
  sources: Array<{ title: string; url: string; }>;
}

interface SelectedIngredient {
  name: string;
  analysis: IngredientAnalysis;
}

export const AnalysisScreen: React.FC<Props> = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<IngredientAnalysis[]>([]);
  const [showOcrText, setShowOcrText] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<SelectedIngredient | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleOCR = () => {
    setShowOcrText(!showOcrText);
    Animated.spring(rotateAnim, {
      toValue: showOcrText ? 0 : 1,
      useNativeDriver: true,
      tension: 125,
      friction: 8,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'safe': return '#4CAF50';
      case 'questionable': return '#FFC107';
      case 'warning': return '#F44336';
      default: return '#757575';
    }
  };

  useEffect(() => {
    const analyzeIngredients = async () => {
      try {
        setLoading(true);
        
        // If we have direct analysis results, use those
        if (route.params.directAnalysisResults) {
          setAnalysisResults(route.params.directAnalysisResults);
          setError(null);
          return;
        }
        
        // Otherwise, parse and analyze the OCR text
        const ingredients = parseIngredients(route.params.scannedText);
        console.log('Parsed ingredients:', ingredients);
        
        if (!ingredients || ingredients.length === 0) {
          setError('No ingredients found in the scanned text. Please try scanning again.');
          return;
        }

        const results = await analyzeIngredientsWithGemini(ingredients);
        setAnalysisResults(results);
        setError(null);
      } catch (err) {
        console.error('Error analyzing ingredients:', err);
        setError('An error occurred while analyzing the ingredients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    analyzeIngredients();
  }, [route.params]);

  const handleSourceClick = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {route.params.savedImagePath && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `file://${route.params.savedImagePath}` }}
              style={styles.sourceImage}
              resizeMode="contain"
            />
          </View>
        )}
        {route.params.scannedText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scanned Text</Text>
            <Text style={styles.scannedText}>{route.params.scannedText}</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredient Analysis</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View>
              {analysisResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.ingredientCard}
                  onPress={() => setSelectedIngredient({ name: result.name, analysis: result })}
                >
                  <View style={[styles.safetyIndicator, { backgroundColor: getSafetyColor(result.safety) }]} />
                  <View style={styles.cardContent}>
                    <Text style={styles.ingredientName}>{result.name}</Text>
                    <Text style={styles.explanation}>{result.explanation}</Text>
                    <Text style={styles.safetyText}>
                      Safety: <Text style={{ color: getSafetyColor(result.safety) }}>{result.safety}</Text>
                    </Text>
                    {result.sources?.map((source, sourceIndex) => (
                      <TouchableOpacity 
                        key={sourceIndex}
                        style={styles.sourceLink}
                        onPress={() => handleSourceClick(source.url)}
                      >
                        <Text style={styles.sourceLinkText}>📚 {source.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.scanAnotherButton}
        onPress={() => navigation.replace('BeeSafe')}
      >
        <Text style={styles.scanAnotherButtonText}>Scan Another</Text>
      </TouchableOpacity>

      <Modal
        visible={selectedIngredient !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedIngredient(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedIngredient(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedIngredient?.name}</Text>
            <Text style={styles.modalSubtitle}>Sources:</Text>
            {selectedIngredient?.analysis.sources.map((source, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSourceClick(source.url)}
                style={styles.sourceLink}
              >
                <Text style={styles.sourceLinkText}>{source.title}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedIngredient(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  sourceImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scannedText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ingredientsList: {
    padding: 16,
  },
  ingredientCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  safetyIndicator: {
    width: 8,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sourceLink: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  sourceLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 32,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    margin: 16,
    fontSize: 16,
  },
  scanAnotherButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  scanAnotherButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
