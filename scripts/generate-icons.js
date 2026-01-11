#!/usr/bin/env node
/**
 * Generate PWA icons from SVG source
 *
 * This script creates PNG icons in required sizes for the PWA manifest.
 * Run with: node scripts/generate-icons.js
 *
 * Requires: sharp (npm install -D sharp)
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const sharp = require('sharp');

  const svgPath = path.join(__dirname, '../public/icons/icon.svg');
  const outputDir = path.join(__dirname, '../public/icons');

  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 192, name: 'icon-192-maskable.png', maskable: true },
    { size: 512, name: 'icon-512.png' },
    { size: 512, name: 'icon-512-maskable.png', maskable: true },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 16, name: 'favicon-16x16.png' },
  ];

  console.log('Generating PWA icons...');

  for (const { size, name, maskable } of sizes) {
    const outputPath = path.join(outputDir, name);

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Created: ${name} (${size}x${size})`);
  }

  console.log('Done!');
}

// Check if sharp is available
try {
  require.resolve('sharp');
  generateIcons().catch(console.error);
} catch (e) {
  console.log('To generate PNG icons, install sharp:');
  console.log('  npm install -D sharp');
  console.log('  node scripts/generate-icons.js');
  console.log('');
  console.log('For now, using SVG icon as fallback.');
}
