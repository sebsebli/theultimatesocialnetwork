#!/usr/bin/env node
/**
 * When any apps/mobile file is staged, run `tsc --noEmit` in apps/mobile once.
 * lint-staged passes file paths; we only care whether any are under apps/mobile.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const files = process.argv.slice(2).map((f) => path.resolve(repoRoot, f));

const hasMobile = files.some((f) => {
  const rel = path.relative(repoRoot, f).split(path.sep).join('/');
  return rel.startsWith('apps/mobile/') || rel === 'apps/mobile';
});

if (!hasMobile) {
  process.exit(0);
  return;
}

const cwd = path.join(repoRoot, 'apps', 'mobile');
const r = spawnSync('npm', ['run', 'type-check'], {
  cwd,
  stdio: 'inherit',
  shell: true,
});
process.exit(r.status ?? 0);
