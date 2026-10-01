const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeCroppedTransparentFrames() {
  const framesDir = path.join(__dirname, '../public/frames');
  const files = [
    { name: 'warden-sculk.jpg', out: 'warden-sculk-transparent.png', darkThreshold: 26 },
    { name: 'pale-garden.jpg', out: 'pale-garden-transparent.png', darkThreshold: 26 },
    { name: 'jack-pumpkin.jpg', out: 'jack-pumpkin-transparent.png', darkThreshold: 26 },
    { name: 'wither.jpg', out: 'wither-transparent.png', darkThreshold: 26 },
    { name: 'ender-dragon.jpg', out: 'ender-dragon-transparent.png', darkThreshold: 26 },
  ];

  for (const item of files) {
    const inputPath = path.join(framesDir, item.name);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`Processing tightly cropped transparent frame for ${item.name}...`);
    
    // 1. Obter raw pixel data (RGBA)
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // Região interna central que deve ser 100% transparente (janela de conteúdo)
    const innerLeft = Math.round(width * 0.17);
    const innerRight = Math.round(width * 0.83);
    const innerTop = Math.round(height * 0.18);
    const innerBottom = Math.round(height * 0.84);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Centro: 100% transparente
        if (x >= innerLeft && x <= innerRight && y >= innerTop && y <= innerBottom) {
          data[idx + 3] = 0;
          continue;
        }

        // Fundo escuro externo: chroma key para transparente
        const brightness = Math.max(r, g, b);
        if (brightness < item.darkThreshold) {
          data[idx + 3] = 0;
        } else if (brightness < item.darkThreshold + 10) {
          const factor = (brightness - item.darkThreshold) / 10;
          data[idx + 3] = Math.round(255 * factor);
        }
      }
    }

    // 2. Criar buffer intermediário e aplicar TRIM automático para remover 100% da zona de respiro vazia
    const transparentBuffer = await sharp(data, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    const trimmedBuffer = await sharp(transparentBuffer)
      .trim({ threshold: 10 })
      .toBuffer();

    // 3. Salvar o PNG final perfeitamente cropado
    const outputPath = path.join(framesDir, item.out);
    await sharp(trimmedBuffer).png().toFile(outputPath);

    const trimmedMeta = await sharp(outputPath).metadata();
    console.log(`Saved ${item.out} (Trimmed dimensions: ${trimmedMeta.width}x${trimmedMeta.height})`);
  }
}

makeCroppedTransparentFrames().catch(console.error);
