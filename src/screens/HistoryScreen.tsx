import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ImageStorageService, StoredScan } from '../services/imageStorageService';
import { useNavigation } from '@react-navigation/native';

export const HistoryScreen = () => {
  const [scans, setScans] = useState<StoredScan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      setLoading(true);
      const allScans = await ImageStorageService.getAllScans();
      setScans(allScans);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanPress = (scan: StoredScan) => {
    navigation.navigate('Analysis', {
      scannedText: scan.ocrText || '',
      directAnalysisResults: scan.analysisResults,
      savedImagePath: scan.imagePath,
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: StoredScan }) => (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => handleScanPress(item)}
    >
      <Image source={{ uri: `file://${item.imagePath}` }} style={styles.thumbnail} />
      <View style={styles.scanInfo}>
        <Text style={styles.scanDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.scanType}>
          {item.ocrText ? 'OCR Analysis' : 'Direct Image Analysis'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={async () => {
          await ImageStorageService.deleteScan(item.id);
          loadScans();
        }}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      {scans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No scans yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Scanned labels will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
    backgroundColor: '#ddd',
  },
  scanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scanDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  scanType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
