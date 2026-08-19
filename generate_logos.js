const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, 'assets', 'images', 'logo.jpg');
const outDir = path.join(__dirname, 'assets', 'images');
const sizes = [48, 128, 256, 512];

if (!fs.existsSync(input)) {
  console.error('Input logo not found:', input);
  process.exit(1);
}

(async () => {
  for (const size of sizes) {
    const pngOut = path.join(outDir, `logo-${size}.png`);
    const webpOut = path.join(outDir, `logo-${size}.webp`);

    try {
      await sharp(input)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 90 })
        .toFile(pngOut);

      await sharp(input)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 80 })
        .toFile(webpOut);

      console.log('Generated', pngOut, webpOut);
    } catch (err) {
      console.error('Error processing size', size, err);
    }
  }
  console.log('Done.');
})();
