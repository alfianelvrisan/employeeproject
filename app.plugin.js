const { withPodfile } = require('@expo/config-plugins');

module.exports = function withFix(config) {
  return withPodfile(config, mod => {
    let contents = mod.modResults.contents;

    // Hapus argumen apa pun pada use_native_modules!
    const useNativePattern = /config\s*=\s*use_native_modules!\s*\([^)]*\)/;
    if (useNativePattern.test(contents)) {
      contents = contents.replace(useNativePattern, 'config = use_native_modules!');
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
