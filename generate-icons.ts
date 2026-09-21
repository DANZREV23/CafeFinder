
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = path.join(process.cwd(), 'src', 'assets', 'images', 'cafefinder_logo_1789953691860.jpg');
const publicDir = path.join(process.cwd(), 'client', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  try {
    // 192x192 any
    await sharp(sourceImage)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'pwa-192x192.png'));

    // 512x512 any
    await sharp(sourceImage)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'pwa-512x512.png'));

    // 180x180 apple touch icon
    await sharp(sourceImage)
      .resize(180, 180)
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Maskable icon (with padding)
    // We add 10% padding (safe zone is 80% center)
    // 512 * 0.1 = 51.2px padding
    // So we resize the original to 410x410 and place it on a 512x512 background
    const background = { r: 252, g: 250, b: 246, alpha: 1 }; // brand-background #FCFAF6
    
    await sharp(sourceImage)
      .resize(410, 410, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: 51,
        bottom: 51,
        left: 51,
        right: 51,
        background: background
      })
      .resize(512, 512)
      .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

    console.log('Icons generated successfully');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
