const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// CRITICAL: Use __dirname to get the mobile app directory, not workspace root
const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Explicitly set project root - this is the key to fixing the resolution issue
config.projectRoot = projectRoot;

// Watch mobile app and monorepo packages (for @citewalk/design-tokens)
const monorepoRoot = path.resolve(projectRoot, '../..');
config.watchFolders = [projectRoot, path.resolve(monorepoRoot, 'packages')];

// Configure resolver
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'ts', 'tsx'],
  // For npm workspaces, node_modules might be in workspace root
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(projectRoot, '../..', 'node_modules'),
  ],
  resolverMainFields: ['react-native', 'browser', 'main'],
  unstable_enableSymlinks: true,
};

module.exports = config;
