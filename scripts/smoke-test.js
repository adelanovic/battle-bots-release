'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
const run = String(Date.now());
const resultFile = path.join(output, 'smoke-' + run + '.json');
const executable = process.argv[2] || require('electron');
const args = process.argv[2] ? [] : [root];
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const result = spawnSync(executable, [...args, '--smoke-test',
  '--test-profile=' + path.join(output, 'profile-' + run), '--test-result=' + resultFile],
  { cwd: root, env, timeout: 45000, encoding: 'utf8' });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (fs.existsSync(resultFile)) {
  const report = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
} else {
  console.error(result.error || 'No desktop test report was produced');
  process.exit(1);
}
if (result.status !== 0) process.exit(1);
