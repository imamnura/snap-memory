module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin HARUS paling terakhir
      'react-native-reanimated/plugin',
    ],
  };
};