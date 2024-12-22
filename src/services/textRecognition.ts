import { VisionCameraProxy, Frame } from 'react-native-vision-camera';
import { NativeModules } from 'react-native';
import { TextRecognitionModule } from '@react-native-ml-kit/text-recognition';

const { TextRecognitionModule: OriginalTextRecognitionModule } = NativeModules;

const commonOCRCorrections: { [key: string]: string } = {
  'cocod': 'cocoa',
  'cocos': 'cocoa',
  'sugan': 'sugar',
  'sugap': 'sugar',
  'vanila': 'vanilla',
  'vanilia': 'vanilla',
  'lecithin': 'lecithin',
  'lecithn': 'lecithin',
  'emulsifer': 'emulsifier',
  'emulsifler': 'emulsifier',
  'powden': 'powder',
  'powdep': 'powder',
  'milr': 'milk',
  'mllk': 'milk',
};

function cleanupOCRText(text: string): string {
  let cleaned = text.replace(/^[:\-.,;]+|[:\-.,;]+$/g, '');
  cleaned = cleaned.toLowerCase();
  for (const [mistake, correction] of Object.entries(commonOCRCorrections)) {
    const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correction);
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
  return cleaned;
}

export const recognizeText = async (imagePath: string): Promise<string> => {
  try {
    const result = await OriginalTextRecognitionModule.recognizeText(imagePath);
    const processedText = result
      .split('\n')
      .map(line => cleanupOCRText(line))
      .filter(text => text.length > 0)
      .join('\n');
    return processedText;
  } catch (error) {
    console.error('Error recognizing text:', error);
    return '';
  }
};

const plugin = VisionCameraProxy.initFrameProcessor('scanOCR');

export const scanOCR = (frame: Frame) => {
  'worklet';
  if (!plugin) {
    console.warn('Text recognition plugin not available');
    return null;
  }
  return plugin.call(frame);
};
