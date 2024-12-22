import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const camera = useRef<Camera>(null);
  
  // Animation values
  const flashButtonScale = useRef(new Animated.Value(1)).current;
  const captureButtonScale = useRef(new Animated.Value(1)).current;
  const viewfinderOpacity = useRef(new Animated.Value(1)).current;

  const animateFlashButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [flashButtonScale]);

  const toggleFlash = useCallback(() => {
    animateFlashButton();
    setFlashMode(current => {
      switch (current) {
        case 'auto': return 'on';
        case 'on': return 'off';
        case 'off': return 'auto';
      }
    });
  }, [animateFlashButton]);

  const getFlashIcon = useCallback(() => {
    switch (flashMode) {
      case 'auto': return '⚡️A';
      case 'on': return '⚡️';
      case 'off': return '⚡️✕';
    }
  }, [flashMode]);

  const animateCapture = useCallback(() => {
    // Animate viewfinder
    Animated.sequence([
      Animated.timing(viewfinderOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(viewfinderOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate capture button
    Animated.sequence([
      Animated.timing(captureButtonScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(captureButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [viewfinderOpacity, captureButtonScale]);

  const onCapturePress = async () => {
    if (camera.current && !isCapturing && !isAnalyzing) {
      setIsCapturing(true);
      animateCapture();
      
      try {
        const photo = await camera.current.takePhoto({
          qualityPriority: 'quality',
          enableAutoStabilization: true,
          flash: flashMode,
        });

        setIsAnalyzing(true);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setIsCapturing(false);
          navigation.navigate('Analysis', { scannedText: 'Processing...' });
        }, 500);
      } catch (error) {
        console.error('Error taking picture:', error);
        setIsCapturing(false);
        setIsAnalyzing(false);
      }
    }
  };

  if (!device) return null;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        enableZoomGesture
      />

      <Animated.View 
        style={[
          styles.flashButton,
          { transform: [{ scale: flashButtonScale }] }
        ]}
      >
        <TouchableOpacity onPress={toggleFlash} activeOpacity={0.7}>
          <Text style={styles.flashButtonText}>{getFlashIcon()}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={[
          styles.viewfinder,
          { opacity: viewfinderOpacity }
        ]}
      >
        <View style={[styles.viewfinderCorner, styles.viewfinderCornerTopLeft]} />
        <View style={[styles.viewfinderCorner, styles.viewfinderCornerTopRight]} />
        <View style={[styles.viewfinderCorner, styles.viewfinderCornerBottomLeft]} />
        <View style={[styles.viewfinderCorner, styles.viewfinderCornerBottomRight]} />
      </Animated.View>

      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Analyzing ingredients...</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.captureButton,
          { transform: [{ scale: captureButtonScale }] },
          (isCapturing || isAnalyzing) && styles.captureButtonDisabled
        ]}
      >
        <TouchableOpacity 
          onPress={onCapturePress}
          disabled={isCapturing || isAnalyzing}
          activeOpacity={0.6}
          style={styles.captureButtonTouchable}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  viewfinder: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  viewfinderCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'white',
  },
  viewfinderCornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  viewfinderCornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  viewfinderCornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  viewfinderCornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
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
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  flashButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
    zIndex: 2,
  },
  flashButtonText: {
    color: 'white',
    fontSize: 18,
  },
});