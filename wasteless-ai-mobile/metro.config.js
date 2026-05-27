const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const sharedWorkspace = path.resolve(workspaceRoot, 'wasteless-ai-shared');
const hasWorkspaceNodeModules = fs.existsSync(workspaceNodeModules);

function existingPaths(paths) {
  return paths.filter((targetPath) => fs.existsSync(targetPath));
}

const config = getDefaultConfig(projectRoot);

config.watchFolders = existingPaths([workspaceNodeModules, sharedWorkspace]);
config.resolver.nodeModulesPaths = existingPaths([projectNodeModules, workspaceNodeModules]);
config.resolver.disableHierarchicalLookup = hasWorkspaceNodeModules;
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectNodeModules, 'react'),
  'react-dom': path.resolve(projectNodeModules, 'react-dom'),
};

module.exports = config;
