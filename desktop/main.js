'use strict';
const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('node:path');
const smoke = process.argv.includes('--smoke-test');
if (smoke) {
  const profile = process.argv.find(a => a.startsWith('--test-profile='));
  if (!profile) throw new Error('Smoke tests require an isolated --test-profile');
  app.setPath('userData', profile.slice('--test-profile='.length));
}
app.setName('Battle Bots');
let win;
app.whenReady().then(async () => {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 650, show: !smoke,
    backgroundColor: '#111827',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const errors = [];
  win.webContents.on('console-message', (details) => {
    if (details.level === 'error') errors.push(details.message);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    if (smoke) finish({ ok: false, error: 'Renderer exited: ' + details.reason });
  });
  try {
    await win.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
    if (smoke) {
      const result = await win.webContents.executeJavaScript('(' + rendererTest.toString() + ')()');
      const fs = require('node:fs');
      const downloadPath = path.join(app.getPath('userData'), 'saved-robot.asm');
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Robot export timed out')), 5000);
        win.webContents.session.once('will-download', (_event, item) => {
          item.setSavePath(downloadPath);
          item.once('done', (_event, state) => {
            clearTimeout(timer);
            state === 'completed' ? resolve() : reject(new Error('Export: ' + state));
          });
        });
        win.webContents.executeJavaScript("document.querySelector('#btn-save').click()").catch(reject);
      });
      if (!fs.readFileSync(downloadPath, 'utf8').includes('Desktop test')) throw new Error('Exported robot content is incorrect');
      result.robotExported = true;
      await win.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
      const restored = await win.webContents.executeJavaScript("BB.app.entries.some(e => e.source.startsWith('Desktop test'))");
      if (!restored) throw new Error('Robot edits were not restored after reload');
      result.restoredAfterReload = true;
      if (errors.length) throw new Error(errors.join('\n'));
      finish({ ok: true, version: app.getVersion(), ...result });
    }
  } catch (error) {
    if (smoke) finish({ ok: false, error: error.stack });
    else { dialog.showErrorBox('Battle Bots could not start', error.message); app.quit(); }
  }
});
app.on('window-all-closed', () => app.quit());
function finish(result) {
  const fs = require('node:fs');
  const output = process.argv.find(a => a.startsWith('--test-result='));
  if (output) fs.writeFileSync(output.slice('--test-result='.length), JSON.stringify(result, null, 2));
  app.exit(result.ok ? 0 : 1);
}
if (smoke) setTimeout(() => finish({ ok: false, error: 'Desktop test timed out' }), 30000);
async function rendererTest() {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const a = globalThis.BB.app;
  check(a && a.entries.length === 5, 'Five example robots must load');
  check(typeof require === 'undefined', 'Renderer must not have Node access');
  check(document.querySelector('#arena').getContext('2d'), 'Canvas must initialize');
  document.querySelector('#welcome').hidden = true;
  document.querySelector('#btn-step').click();
  check(a.world.tick === 1, 'Step must advance the simulation');
  document.querySelector('#btn-run').click();
  await new Promise(resolve => setTimeout(resolve, 450));
  document.querySelector('#btn-run').click();
  check(a.world.tick > 1, 'Start must run the simulation');
  const ticks = a.world.tick;
  document.querySelector('#btn-reset').click();
  check(a.world.tick === 0, 'Reset must clear the simulation');
  a.editor.value = 'Desktop test\nloop:\n    SPEED 2\n    WAIT\n    JMP loop';
  a.editor.input.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#btn-apply').click();
  check(a.selected.compiled.errors.length === 0, 'Edited robot must compile');
  a.persist();
  const saved = localStorage.getItem('battlebots.roster.v1');
  check(saved && saved.includes('Desktop test'), 'Robot edits must persist');

  const transfer = new DataTransfer();
  transfer.items.add(new File(['Imported robot\nloop:\n    WAIT\n    JMP loop'], 'imported.asm', { type: 'text/plain' }));
  const input = document.querySelector('#file-input');
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 150));
  check(a.entries.some(e => e.filename === 'imported.asm' && !e.compiled.errors.length), 'Imported robot must load and compile');
  a.select(a.entries.find(e => e.source.startsWith('Desktop test')).id);
  return { examples: 5, ticks, editedRobotSaved: true, robotImported: true, sandboxed: true };
}
