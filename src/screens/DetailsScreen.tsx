import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import type { DetailsScreenProps } from '../types/navigation';

export const DetailsScreen: React.FC<DetailsScreenProps> = ({ route }) => {
  const { ingredientName, safetyInfo } = route.params;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'safe':
        return '#4CAF50';
      case 'questionable':
        return '#FFC107';
      case 'warning':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'safe':
        return '✅';
      case 'questionable':
        return '⚠️';
      case 'warning':
        return '❌';
      default:
        return '❓';
    }
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.ingredientName}>{ingredientName}</Text>
        <Text style={[styles.rating, { color: getRatingColor(safetyInfo.rating) }]}>
          {getRatingIcon(safetyInfo.rating)} {safetyInfo.rating.toUpperCase()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Information</Text>
        <Text style={styles.explanation}>{safetyInfo.explanation}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sources</Text>
        {safetyInfo.sources.map((source, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sourceItem}
            onPress={() => openUrl(source.url)}
          >
            <Text style={styles.sourceTitle}>{source.title}</Text>
            <Text style={styles.sourceUrl}>{source.url}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ingredientName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rating: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  sourceItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  sourceUrl: {
    fontSize: 14,
    color: '#2196F3',
  },
});

export default DetailsScreen;
