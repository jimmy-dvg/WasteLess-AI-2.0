const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');
const workletsPlugin = require('react-native-worklets/plugin');

module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [expoRouterBabelPlugin, workletsPlugin],
  };
};
