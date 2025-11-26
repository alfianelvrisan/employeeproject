const { withPodfile } = require('@expo/config-plugins');

module.exports = function withFix(config) {
  return withPodfile(config, mod => {
    let contents = mod.modResults.contents;

    // Hapus argumen apa pun pada use_native_modules!
    const useNativePattern = /config\s*=\s*use_native_modules!\s*\([^)]*\)/;
    if (useNativePattern.test(contents)) {
      contents = contents.replace(useNativePattern, 'config = use_native_modules!');
    }

    // Pastikan ReactAppDependencyProvider diambil dari node_modules lokal
    const useReactNativeCall = /use_react_native!\([\s\S]*?\)\n/;
    if (useReactNativeCall.test(contents) && !contents.includes("ReactAppDependencyProvider")) {
      contents = contents.replace(
        useReactNativeCall,
        match =>
          `${match}  pod 'ReactAppDependencyProvider', :path => '../node_modules/react-native/ReactAppDependencyProvider.podspec'\n`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
