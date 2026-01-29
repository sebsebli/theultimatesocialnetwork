#!/usr/bin/env node
/**
 * Watch apps/api and infra/docker; run infra/docker/deploy.sh dev on changes.
 * Run from repo root: npm run deploy:watch
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEBOUNCE_MS = 4000;
const WATCH_DIRS = [
  path.join(ROOT, 'apps', 'api'),
  path.join(ROOT, 'infra', 'docker'),
];

let timeout = null;

function runDeploy() {
  console.log('\n[watch-and-deploy] Changes detected — redeploying...\n');
  const child = spawn('./deploy.sh', ['dev'], {
    cwd: path.join(ROOT, 'infra', 'docker'),
    stdio: 'inherit',
    shell: true,
  });
  child.on('close', (code) => {
    if (code !== 0) console.error('[watch-and-deploy] Deploy exited with code', code);
    else console.log('[watch-and-deploy] Deploy finished.\n');
  });
}

function scheduleDeploy() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    timeout = null;
    runDeploy();
  }, DEBOUNCE_MS);
}

function watchDir(dir) {
  if (!fs.existsSync(dir)) {
    console.warn('[watch-and-deploy] Skip (missing):', dir);
    return;
  }
  try {
    fs.watch(dir, { recursive: true }, (event, filename) => {
      if (!filename) return;
      const ext = path.extname(filename);
      if (ext === '.ts' || ext === '.js' || ext === '.json' || ext === '.yml' || ext === '.yaml' || ext === '.sh' || ext === '.env' || filename.includes('.env')) {
        console.log('[watch-and-deploy] Change:', path.relative(ROOT, path.join(dir, filename)));
        scheduleDeploy();
      }
    });
    console.log('[watch-and-deploy] Watching:', path.relative(ROOT, dir));
  } catch (err) {
    console.error('[watch-and-deploy] Watch error for', dir, err.message);
  }
}

console.log('[watch-and-deploy] Auto-redeploy on API / infra changes. Ctrl+C to stop.\n');
WATCH_DIRS.forEach(watchDir);
runDeploy();
