import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { analyzeImageWithGemini } from '../services/geminiImageService';
import { ImageStorageService } from '../services/imageStorageService';
import type { ScanScreenProps } from '../types/navigation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = React.useState(false);
  const device = useCameraDevice('back');
  const [error, setError] = useState('');
  const [isLowLight, setIsLowLight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const camera = useRef<Camera>(null);

  // Request permissions on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      console.log('Camera permission status:', cameraPermission);
      setHasPermission(cameraPermission === 'granted');
    } catch (err) {
      console.error('Permission error:', err);
      setError('Failed to get camera permission');
    }
  };

  const onScanPress = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setLoadingMessage('Taking photo...');
      setError('');
      
      console.log('Scan button pressed');
      if (!camera.current) {
        console.error('Camera ref is null');
        setError('Camera not ready');
        return;
      }

      const startTime = Date.now();
      console.log('Taking photo...');
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
        flash: flashMode
      });
      
      console.log('Photo taken:', photo);
      console.log('Photo capture took:', Date.now() - startTime, 'ms');
      
      // Create the full file path
      const filePath = Platform.OS === 'android' 
        ? `file://${photo.path}`
        : photo.path;
        
      console.log('Processing photo at path:', filePath);

      setLoadingMessage('Analyzing image with AI...');
      console.log('Using direct image analysis with Gemini Vision...');
      const analysisStartTime = Date.now();
      const analysisResults = await analyzeImageWithGemini(filePath);
      console.log('Direct image analysis took:', Date.now() - analysisStartTime, 'ms');
      console.log('Total processing time:', Date.now() - startTime, 'ms');

      // Save the scan
      const scan = await ImageStorageService.saveImage(
        filePath,
        '',  // No OCR text since we're using direct analysis
        analysisResults
      );

      // Navigate to analysis
      navigation.navigate('Analysis', {
        scannedText: '',
        directAnalysisResults: analysisResults,
        savedImagePath: scan.imagePath
      });
    } catch (err) {
      console.error('Scanning error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [navigation, flashMode, loading]);

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
      }
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'off':
        return 'flash-off';
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash-auto';
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        flash={flashMode}
        enableZoomGesture
      />
      <TouchableOpacity
        style={styles.flashButton}
        onPress={toggleFlash}
      >
        <MaterialCommunityIcons
          name={getFlashIcon()}
          size={24}
          color="white"
        />
      </TouchableOpacity>
      <View style={styles.overlay}>
        {/* Scanning guide overlay */}
        <View style={styles.scanArea}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        )}

        {/* Status and controls */}
        <View style={styles.controls}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <Text style={styles.guideText}>
                Point camera at ingredient label
              </Text>
              {isLowLight && (
                <Text style={styles.warningText}>
                  Low light detected - flash will be used
                </Text>
              )}
              <TouchableOpacity 
                style={[
                  styles.captureButton,
                  loading && styles.captureButtonDisabled,
                  isLowLight && styles.captureButtonLowLight
                ]}
                onPress={onScanPress}
                disabled={loading}
              >
                <Text style={[styles.buttonText, loading && styles.buttonTextDisabled]}>
                  {loading ? 'Processing...' : isLowLight ? 'Scan Label (with Flash)' : 'Scan Label'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const CORNER_SIZE = 40;
const STROKE_WIDTH = 4;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    marginTop: SCREEN_HEIGHT * 0.2,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: STROKE_WIDTH,
    borderLeftWidth: STROKE_WIDTH,
    borderColor: '#2196F3',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: STROKE_WIDTH,
    borderRightWidth: STROKE_WIDTH,
    borderColor: '#2196F3',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: STROKE_WIDTH,
    borderLeftWidth: STROKE_WIDTH,
    borderColor: '#2196F3',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: STROKE_WIDTH,
    borderRightWidth: STROKE_WIDTH,
    borderColor: '#2196F3',
  },
  controls: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  warningText: {
    color: '#FFA726',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  captureButtonLowLight: {
    backgroundColor: '#FFA726',
  },
  captureButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  flashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
