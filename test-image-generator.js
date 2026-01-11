// Script to create a 500x500px test image with a red square on green background
const sharp = require('sharp');

async function createTestImage() {
  // Create a green background (500x500)
  const width = 500;
  const height = 500;

  // Create green background
  const greenBackground = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    greenBackground[i * 4] = 0;       // R
    greenBackground[i * 4 + 1] = 200; // G
    greenBackground[i * 4 + 2] = 0;   // B
    greenBackground[i * 4 + 3] = 255; // A
  }

  // Create red square (200x200 centered)
  const squareSize = 200;
  const startX = (width - squareSize) / 2;
  const startY = (height - squareSize) / 2;

  for (let y = startY; y < startY + squareSize; y++) {
    for (let x = startX; x < startX + squareSize; x++) {
      const i = (y * width + x);
      greenBackground[i * 4] = 220;     // R
      greenBackground[i * 4 + 1] = 0;   // G
      greenBackground[i * 4 + 2] = 0;   // B
      greenBackground[i * 4 + 3] = 255; // A
    }
  }

  await sharp(greenBackground, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .png()
    .toFile('test-red-square-green-bg.png');

  console.log('Test image created: test-red-square-green-bg.png');
}

createTestImage().catch(console.error);
