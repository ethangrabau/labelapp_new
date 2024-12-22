const sharp = require('sharp');
const path = require('path');

const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const SOURCE_LOGO = path.join(__dirname, '../src/assets/beesafelogo.jpeg');
const BASE_OUTPUT_DIR = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  for (const [folder, size] of Object.entries(ICON_SIZES)) {
    const outputPath = path.join(BASE_OUTPUT_DIR, folder, 'ic_launcher.png');
    await sharp(SOURCE_LOGO)
      .resize(size, size)
      .toFormat('png')
      .toFile(outputPath);
    
    // Also create round icon
    const roundOutputPath = path.join(BASE_OUTPUT_DIR, folder, 'ic_launcher_round.png');
    await sharp(SOURCE_LOGO)
      .resize(size, size)
      .composite([{
        input: Buffer.from(`<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`),
        blend: 'dest-in'
      }])
      .toFormat('png')
      .toFile(roundOutputPath);
  }
}

generateIcons().catch(console.error);
