const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeTransparentFrames() {
  const framesDir = path.join(__dirname, '../public/frames');
  const files = [
    { name: 'warden-sculk.jpg', out: 'warden-sculk-transparent.png', darkThreshold: 28 },
    { name: 'pale-garden.jpg', out: 'pale-garden-transparent.png', darkThreshold: 28 },
    { name: 'jack-pumpkin.jpg', out: 'jack-pumpkin-transparent.png', darkThreshold: 28 },
    { name: 'wither.jpg', out: 'wither-transparent.png', darkThreshold: 28 },
    { name: 'ender-dragon.jpg', out: 'ender-dragon-transparent.png', darkThreshold: 28 },
  ];

  for (const item of files) {
    const inputPath = path.join(framesDir, item.name);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`Processing transparency for ${item.name}...`);
    
    // Obter raw pixel data (RGBA)
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // Região interna central que deve ser 100% transparente
    const innerLeft = Math.round(width * 0.20);
    const innerRight = Math.round(width * 0.80);
    const innerTop = Math.round(height * 0.22);
    const innerBottom = Math.round(height * 0.82);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // 1. Centro da moldura: 100% transparente
        if (x >= innerLeft && x <= innerRight && y >= innerTop && y <= innerBottom) {
          data[idx + 3] = 0; // Alpha = 0
          continue;
        }

        // 2. Fundo externo escuro: chroma key para transparente se for fundo
        const brightness = Math.max(r, g, b);
        if (brightness < item.darkThreshold) {
          data[idx + 3] = 0; // Alpha = 0
        } else if (brightness < item.darkThreshold + 12) {
          // Suave anti-aliasing na transição
          const factor = (brightness - item.darkThreshold) / 12;
          data[idx + 3] = Math.round(255 * factor);
        }
      }
    }

    // Salvar o PNG transparente
    const outputPath = path.join(framesDir, item.out);
    await sharp(data, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toFile(outputPath);

    console.log(`Saved transparent frame: ${item.out}`);
  }
}

makeTransparentFrames().catch(console.error);
