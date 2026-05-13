/** electron-builder 設定（macOS DMG ビルド） */
module.exports = {
  appId: 'com.example.threecolor',
  productName: '3Color',
  copyright: 'Copyright © 2026',
  directories: {
    output: 'dist-electron',
    buildResources: 'public',
  },
  files: ['electron/**/*.js', 'package.json'],
  mac: {
    category: 'public.app-category.productivity',
    icon: 'public/icons/icon-512.svg',
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    hardenedRuntime: true,
    gatekeeperAssess: false,
  },
  publish: {
    provider: 'github',
    owner: '<github-owner>',
    repo: '<github-repo>',
  },
}
