module.exports = function (api) {
  api.cache(true); // Force cache invalidation
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
