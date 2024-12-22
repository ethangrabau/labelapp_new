import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ImageStorageService, StoredScan } from '../services/imageStorageService';
import { RootStackParamList } from '../types/navigation';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const [scans, setScans] = useState<StoredScan[]>([]);
  const navigation = useNavigation<HistoryScreenNavigationProp>();

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const savedScans = await ImageStorageService.getAllScans();
      setScans(savedScans.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading scans:', error);
    }
  };

  const handleScanPress = (scan: StoredScan) => {
    navigation.navigate('Main', {
      screen: 'Analysis',
      params: {
        scannedText: scan.ocrText || '',
        directAnalysisResults: scan.analysisResults,
        savedImagePath: scan.imagePath,
      },
    });
  };

  const renderItem = ({ item }: { item: StoredScan }) => (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => handleScanPress(item)}
    >
      <Image source={{ uri: `file://${item.imagePath}` }} style={styles.thumbnail} />
      <View style={styles.scanInfo}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {scans.length > 0 ? (
        <FlatList
          data={scans}
          renderItem={renderItem}
          keyExtractor={(item) => item.timestamp.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No scans yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  scanItem: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});
