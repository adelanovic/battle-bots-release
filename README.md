# Battle Bots for Windows

[Download the latest Windows installer](https://github.com/adelanovic/battle-bots-release/releases/latest/download/BattleBotsSetup.exe)

Install Battle Bots on Windows 10 or 11 (64-bit). No browser, Node.js installation, or internet connection is required to play.

Run the installer, choose an installation folder, and launch **Battle Bots** from the Start menu or desktop shortcut. Uninstall through Windows Settings > Apps.

This initial release is unsigned; Windows may show an unknown-publisher or SmartScreen prompt. Automatic updates are not enabled. To update, download and run the latest installer. Saved robots and mission progress are kept in the user's application data folder. Browser saves are separate; export/import .asm files to transfer robots.

## Source

The game lives at [assemblybattlebots.github.io](https://github.com/adelanovic/assemblybattlebots.github.io).
This repository contains only the Windows launcher, packaging configuration, and release workflow.
source.json pins the exact game commit included in a build. Generated game files and binaries are ignored by Git.
The app and game are MIT licensed.

## Build and test locally

Requires Windows, Git, and Node.js 24.

    npm ci
    npm run sync
    npm test
    npm run test:desktop
    npm run dist
    node scripts/smoke-test.js dist/win-unpacked/BattleBots.exe
    powershell -ExecutionPolicy Bypass -File scripts/test-installer.ps1

The installer is dist/BattleBotsSetup.exe. Desktop smoke tests use isolated profiles and check the arena, simulation controls, robot editing, importing, exporting, and persistence.

To prepare source from an existing local checkout instead of cloning:

    npm run sync -- --local C:\path\to\assemblybattlebots.github.io

## Publish an update

1. Set source.json to the full commit hash of the game version to ship. Push that game commit to its source repository first.
2. Increase package.json version with npm version patch --no-git-tag-version (also updates the lockfile).
3. Update RELEASE_NOTES.md, then run the local build and tests above.
4. Commit and push the release repository, then create and push the matching version tag:

       git add .
       git commit -m "Release 1.0.1"
       git push origin main
       git tag v1.0.1
       git push origin v1.0.1

GitHub Actions builds and tests the app, then publishes the installer and SHA-256 checksum as GitHub Release assets.
A manual workflow run produces downloadable build artifacts without publishing a release.
Keep the app ID and executable name stable so newer installers update the same app.
The stable download URL above follows the latest published release.

Do not commit installers, tokens, signing certificates, private robot files, or generated app files.
