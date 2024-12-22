import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { ScanScreenProps } from '../types/navigation';

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = React.useState(false);
  const device = useCameraDevice('back');
  const [error, setError] = useState('');
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
    try {
      console.log('Scan button pressed');
      if (!camera.current) {
        console.error('Camera ref is null');
        setError('Camera not ready');
        return;
      }

      console.log('Taking photo...');
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
        flash: 'off'
      });
      
      console.log('Photo taken:', photo);
      
      // Create the full file path
      const filePath = Platform.OS === 'android' 
        ? `file://${photo.path}`
        : photo.path;
        
      console.log('Processing photo at path:', filePath);
      
      const result = await TextRecognition.recognize(filePath);
      console.log('Recognition result:', result);
      
      if (result.text) {
        navigation.navigate('Analysis', { scannedText: result.text });
      } else {
        setError('No text found');
      }
    } catch (err) {
      console.error('Scanning error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan');
    }
  }, [navigation]);

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
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.guideText}>Point camera at ingredient label</Text>
        )}
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={onScanPress}
        >
          <Text style={styles.buttonText}>Scan Label</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  guideText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 25,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScanScreen;
