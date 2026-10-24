'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'source.json'), 'utf8').replace(/^\uFEFF/, ''));
const localIndex = process.argv.indexOf('--local');
let repo;
if (localIndex >= 0) {
  repo = path.resolve(process.argv[localIndex + 1]);
} else {
  repo = path.join(root, '.source-cache');
  if (!fs.existsSync(repo)) execFileSync('git', ['clone', '--no-checkout', source.repository, repo], { stdio: 'inherit' });
  execFileSync('git', ['fetch', 'origin', source.commit], { cwd: repo, stdio: 'inherit' });
}
if (!/^[a-f0-9]{40}$/.test(source.commit)) throw new Error('source.commit must be a full Git commit hash');
const zip = path.join(root, '.source.zip');
execFileSync('git', ['archive', '--format=zip', '--output', zip, source.commit,
  'index.html', 'css', 'js', 'examples', 'LICENSE', 'Battle Bots Student Guide.pdf', 'tests', 'tools'],
  { cwd: repo, stdio: 'inherit' });
const dest = path.join(root, 'app');
if (path.dirname(dest) !== root || path.basename(dest) !== 'app') throw new Error('Invalid generated source path');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
const quote = s => "'" + s.replace(/'/g, "''") + "'";
execFileSync('powershell.exe', ['-NoProfile', '-Command',
  "$ErrorActionPreference = 'Stop'; Expand-Archive -LiteralPath " + quote(zip) + ' -DestinationPath ' + quote(dest) + ' -Force'],
  { stdio: 'inherit' });
fs.unlinkSync(zip);
console.log('Game source prepared at ' + source.commit);
