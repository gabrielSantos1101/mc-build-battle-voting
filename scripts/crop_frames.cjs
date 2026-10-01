const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processFrames() {
  const framesDir = path.join(__dirname, '../public/frames');
  const files = ['warden-sculk.jpg', 'pale-garden.jpg', 'jack-pumpkin.jpg', 'wither.jpg', 'ender-dragon.jpg'];

  for (const file of files) {
    const inputPath = path.join(framesDir, file);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`Processing ${file}...`);
    
    // Auto-trim the dark borders using threshold
    const image = sharp(inputPath);
    const { width, height } = await image.metadata();

    // Crop around 8% from top, 6% from bottom, 7% from left, 7% from right to remove the black margin
    const cropLeft = Math.round(width * 0.07);
    const cropTop = Math.round(height * 0.05);
    const cropWidth = Math.round(width * 0.86);
    const cropHeight = Math.round(height * 0.90);

    const croppedBuffer = await image
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .toBuffer();

    // Save as cropped PNG
    const outputName = file.replace('.jpg', '-cropped.png');
    await sharp(croppedBuffer).png().toFile(path.join(framesDir, outputName));
    console.log(`Saved ${outputName}`);
  }

  // Also crop the header from the concept image
  const conceptPath = 'C:/Users/gabri/.gemini/antigravity/brain/e2f79aa8-4f4d-43cd-85cf-260e3a64e7d5/minecraft_voting_ui_1790826749709.jpg';
  if (fs.existsSync(conceptPath)) {
    console.log('Extracting header banner from concept...');
    // Header is located around y: 70 to 145, x: 75 to 1300
    await sharp(conceptPath)
      .extract({ left: 75, top: 70, width: 1225, height: 75 })
      .png()
      .toFile(path.join(__dirname, '../public/textures/concept-header.png'));
    console.log('Saved concept-header.png');
  }
}

processFrames().catch(console.error);
