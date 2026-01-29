#!/usr/bin/env node
/**
 * Run ESLint from the correct app directory so each app's eslint.config is found.
 * lint-staged passes file paths; we group by app (apps/api, apps/web) and run
 * eslint --fix from that app's cwd.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const files = process.argv.slice(2).map((f) => path.resolve(repoRoot, f));

const byApp = { api: [], web: [] };
for (const f of files) {
  const rel = path.relative(repoRoot, f).split(path.sep).join('/');
  if (rel.startsWith('apps/api/') || rel === 'apps/api') byApp.api.push(f);
  else if (rel.startsWith('apps/web/') || rel === 'apps/web') byApp.web.push(f);
}

let exitCode = 0;
for (const [app, list] of Object.entries(byApp)) {
  if (list.length === 0) continue;
  const cwd = path.join(repoRoot, 'apps', app);
  const r = spawnSync('npx', ['eslint', '--fix', ...list], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) exitCode = r.status;
}
process.exit(exitCode);
