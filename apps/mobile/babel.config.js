module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated plugin removed since reanimated is not actively used
    // If you need reanimated features in the future, add:
    // plugins: ['react-native-reanimated/plugin'], // Must be last
  };
};
