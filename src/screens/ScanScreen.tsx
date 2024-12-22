import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions, Switch, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { analyzeImageWithGemini } from '../services/geminiImageService';
import ImageStorageService from '../services/imageStorageService';
import type { ScanScreenProps } from '../types/navigation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = React.useState(false);
  const device = useCameraDevice('back');
  const [error, setError] = useState('');
  const [isLowLight, setIsLowLight] = useState(false);
  const [useDirectImageAnalysis, setUseDirectImageAnalysis] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const camera = useRef<Camera>(null);

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermission();
        console.log('Camera permission status:', cameraPermission);
        setHasPermission(cameraPermission === 'granted');
      } catch (err) {
        console.error('Permission error:', err);
        setError('Failed to get camera permission');
      }
    })();
  }, []);

  const onScanPress = useCallback(async () => {
    if (loading) return; // Prevent multiple scans while processing
    
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
        flash: isLowLight ? 'on' : 'off'
      });
      
      console.log('Photo taken:', photo);
      console.log('Photo capture took:', Date.now() - startTime, 'ms');
      
      // Create the full file path
      const filePath = Platform.OS === 'android' 
        ? `file://${photo.path}`
        : photo.path;
        
      console.log('Processing photo at path:', filePath);

      let ocrText = '';
      let analysisResults = null;

      if (useDirectImageAnalysis) {
        setLoadingMessage('Analyzing image with AI...');
        console.log('Using direct image analysis with Gemini Vision...');
        const analysisStartTime = Date.now();
        analysisResults = await analyzeImageWithGemini(filePath);
        console.log('Direct image analysis took:', Date.now() - analysisStartTime, 'ms');
        console.log('Total processing time:', Date.now() - startTime, 'ms');
      } else {
        setLoadingMessage('Reading text from image...');
        console.log('Using OCR + Text analysis...');
        const ocrStartTime = Date.now();
        const result = await TextRecognition.recognize(filePath);
        console.log('OCR took:', Date.now() - ocrStartTime, 'ms');
        ocrText = result.text || '';
        console.log('OCR Raw Text Result:', ocrText);
        
        if (!ocrText) {
          setError('No text found');
          return;
        }
      }

      // Save the scan
      const scan = await ImageStorageService.saveImage(
        filePath,
        ocrText,
        analysisResults
      );

      // Navigate to analysis
      navigation.navigate('Analysis', {
        scannedText: ocrText,
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
  }, [navigation, isLowLight, useDirectImageAnalysis, loading]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required</Text>
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={async () => {
            try {
              const permission = await Camera.requestCameraPermission();
              setHasPermission(permission === 'granted');
            } catch (err) {
              console.error('Permission request error:', err);
              setError('Failed to request camera permission');
            }
          }}
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
        enableZoomGesture
      />
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
              <View style={styles.modeSwitch}>
                <Text style={styles.modeSwitchText}>
                  {useDirectImageAnalysis ? 'Direct Image Analysis' : 'OCR + Text Analysis'}
                </Text>
                <Switch
                  value={useDirectImageAnalysis}
                  onValueChange={setUseDirectImageAnalysis}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={useDirectImageAnalysis ? '#2196F3' : '#f4f3f4'}
                />
              </View>
              <TouchableOpacity 
                style={[
                  styles.captureButton,
                  isLowLight && styles.captureButtonLowLight
                ]}
                onPress={onScanPress}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {isLowLight ? 'Scan Label (with Flash)' : 'Scan Label'}
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
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modeSwitchText: {
    color: 'white',
    marginRight: 10,
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
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
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
});
