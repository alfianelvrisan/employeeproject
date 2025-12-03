#!/usr/bin/env node
/**
 * Creates a padded variant of the LBI logo so the Android adaptive icon isn't edge-to-edge.
 */
const fs = require('fs');
const path = require('path');
const {
  generateImageAsync,
  generateImageBackgroundAsync,
  compositeImagesAsync
} = require('@expo/image-utils');

async function createPaddedAndroidIconAsync({
  projectRoot = path.resolve(__dirname, '..'),
  src = path.join(projectRoot, 'assets/images/lbilogo.png'),
  dest = path.join(projectRoot, 'assets/images/lbilogo_padded.png'),
  canvasSize = 1024,
  scaleRatio = 0.68
} = {}) {
  const targetSize = Math.round(canvasSize * scaleRatio);

  const background = await generateImageBackgroundAsync({
    width: canvasSize,
    height: canvasSize,
    backgroundColor: 'transparent'
  });

  const {
    source: foreground
  } = await generateImageAsync({
    projectRoot,
    cacheType: 'android-padded-icon'
  }, {
    src,
    width: targetSize,
    height: targetSize,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
    name: 'lbilogo_padded.png'
  });

  const padded = await compositeImagesAsync({
    background,
    foreground,
    x: Math.round((canvasSize - targetSize) / 2),
    y: Math.round((canvasSize - targetSize) / 2)
  });

  await fs.promises.writeFile(dest, padded);
  if (!process.env.CI) {
    console.log(`✅ Created padded Android icon at ${path.relative(projectRoot, dest)}`);
  }
}

module.exports = {
  createPaddedAndroidIconAsync
};

if (require.main === module) {
  createPaddedAndroidIconAsync().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
