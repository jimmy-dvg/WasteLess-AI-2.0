/* global __dirname */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const workspaceNodeModules = path.join(projectRoot, 'node_modules');

const expoCliPath = require.resolve('expo/bin/cli', {
  paths: [projectRoot],
});

const env = {
  ...process.env,
  NODE_PATH: [workspaceNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
};

const result = spawnSync(process.execPath, [expoCliPath, 'export', '--platform', 'web'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
