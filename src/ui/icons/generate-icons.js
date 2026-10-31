const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconSvgPath = path.join(__dirname, 'icon.svg');
const iconSizes = [16, 48, 128];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(iconSvgPath);

  for (const size of iconSizes) {
    const outputPath = path.join(__dirname, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated icon-${size}.png (${size}x${size})`);
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
