import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export interface StoredScan {
  id: string;
  timestamp: number;
  imagePath: string;
  ocrText?: string;
  analysisResults?: any;
}

const APP_DIRECTORY = `${RNFS.DocumentDirectoryPath}/BeeSafe`;
const SCANS_DIRECTORY = `${APP_DIRECTORY}/scans`;

export const ImageStorageService = {
  async initialize() {
    try {
      // Create app directories if they don't exist
      const appDirExists = await RNFS.exists(APP_DIRECTORY);
      if (!appDirExists) {
        await RNFS.mkdir(APP_DIRECTORY);
      }
      
      const scansDirExists = await RNFS.exists(SCANS_DIRECTORY);
      if (!scansDirExists) {
        await RNFS.mkdir(SCANS_DIRECTORY);
      }
    } catch (error) {
      console.error('Error initializing storage directories:', error);
      throw error;
    }
  },

  async saveImage(sourceUri: string, ocrText?: string, analysisResults?: any): Promise<StoredScan> {
    try {
      await this.initialize();

      const timestamp = Date.now();
      const id = `scan_${timestamp}`;
      const extension = sourceUri.split('.').pop();
      const destinationPath = `${SCANS_DIRECTORY}/${id}.${extension}`;

      // Copy the image to our app's storage
      if (Platform.OS === 'android' && sourceUri.startsWith('file://')) {
        await RNFS.copyFile(sourceUri.replace('file://', ''), destinationPath);
      } else {
        await RNFS.copyFile(sourceUri, destinationPath);
      }

      // Create scan metadata
      const scan: StoredScan = {
        id,
        timestamp,
        imagePath: destinationPath,
        ocrText,
        analysisResults
      };

      // Save metadata
      await this.saveScanMetadata(scan);

      return scan;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  },

  async saveScanMetadata(scan: StoredScan) {
    try {
      const metadataPath = `${SCANS_DIRECTORY}/${scan.id}.json`;
      await RNFS.writeFile(metadataPath, JSON.stringify(scan, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving scan metadata:', error);
      throw error;
    }
  },

  async getAllScans(): Promise<StoredScan[]> {
    try {
      await this.initialize();

      const files = await RNFS.readDir(SCANS_DIRECTORY);
      const metadataFiles = files.filter(file => file.name.endsWith('.json'));
      
      const scans = await Promise.all(
        metadataFiles.map(async file => {
          const content = await RNFS.readFile(file.path, 'utf8');
          return JSON.parse(content) as StoredScan;
        })
      );

      // Sort by timestamp, newest first
      return scans.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting scans:', error);
      return [];
    }
  },

  async getScanById(id: string): Promise<StoredScan | null> {
    try {
      const metadataPath = `${SCANS_DIRECTORY}/${id}.json`;
      const exists = await RNFS.exists(metadataPath);
      
      if (!exists) {
        return null;
      }

      const content = await RNFS.readFile(metadataPath, 'utf8');
      return JSON.parse(content) as StoredScan;
    } catch (error) {
      console.error('Error getting scan:', error);
      return null;
    }
  },

  async deleteScan(id: string): Promise<boolean> {
    try {
      const scan = await this.getScanById(id);
      if (!scan) {
        return false;
      }

      // Delete image file
      if (await RNFS.exists(scan.imagePath)) {
        await RNFS.unlink(scan.imagePath);
      }

      // Delete metadata file
      const metadataPath = `${SCANS_DIRECTORY}/${id}.json`;
      if (await RNFS.exists(metadataPath)) {
        await RNFS.unlink(metadataPath);
      }

      return true;
    } catch (error) {
      console.error('Error deleting scan:', error);
      return false;
    }
  }
};
