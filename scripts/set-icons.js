#!/usr/bin/env node
/**
 * Generates Android/iOS app icons from the Expo config so native projects stay in sync.
 */
const path = require('path');
const { getConfig } = require('@expo/config');
const { setIconAsync } = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');
const { setIconsAsync } = require('@expo/prebuild-config/build/plugins/icons/withIosIcons');

async function runAsync() {
  const projectRoot = path.resolve(__dirname, '..');
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true
  });

  if (!exp) {
    throw new Error('Unable to read Expo config.');
  }

  const adaptive = exp.android?.adaptiveIcon ?? {};
  const androidIcon = adaptive.foregroundImage ?? exp.android?.icon ?? exp.icon;

  if (!androidIcon) {
    throw new Error('No Android icon defined in app.json (android.icon, android.adaptiveIcon.foregroundImage, or icon).');
  }

  await setIconAsync(projectRoot, {
    icon: androidIcon,
    backgroundColor: adaptive.backgroundColor,
    backgroundImage: adaptive.backgroundImage,
    monochromeImage: adaptive.monochromeImage,
    isAdaptive: !!exp.android?.adaptiveIcon
  });

  await setIconsAsync(exp, projectRoot);
  console.log('✅  Android and iOS icons refreshed from app.json');
}

runAsync().catch(error => {
  console.error(error);
  process.exit(1);
});
