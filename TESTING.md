# Release validation: 1.0.0

Game source: f4e963f6f523bfa82934bade05d9dadb024b8676
Electron: 45.0.0
electron-builder: 26.18.0
Platform tested locally: Windows 11 x64 (build 26200)

- Game suite: 120 passed, 0 failed.
- Desktop source and packaged executable: example roster, canvas, step/start/pause/reset, robot editing and compilation, .asm import/export, persistence after reload, and renderer Node isolation passed.
- Installed executable: same desktop checks passed.
- Silent installation into a temporary test directory passed.
- Windows uninstall registration, desktop shortcut, and Start menu shortcut verified.
- Silent uninstall removed the executable, registration, and shortcuts.
- Pinned game source fetched successfully from its public repository.
- Release workflow YAML parsed successfully.
- Runtime archive checked for unintended private robots, tooling, and test files.
- npm install audit: 0 vulnerabilities.

Installer: BattleBotsSetup.exe
Size: 122748350 bytes
SHA-256: 7506b3726f404bcf1af9611df4c1556c5703ce4d41d6e9003b412f5753dd86e5

The installer is unsigned. Windows 10 compatibility is targeted but was not tested on a separate Windows 10 machine. Interactive setup pages were not manually clicked through; install and uninstall were tested in silent mode. Automatic app updates are not enabled.
