# BuJo Vault

Desktop bullet journal app. Electron + React + TypeScript + Tailwind.

## Develop

```
npm install
npm run electron:dev
```

## Build

```
npm run build
npx electron-builder --win
```

Output: `dist-electron/win-unpacked/BuJo Vault.exe`

## Vault

Entries stored as markdown in `~/bujo-vault/`:

```
daily/        YYYY-MM-DD.md
monthly/      YYYY-MM.md
future/       future.md
reflections/  YYYY-MM.md
perspectives/ 6 review prompts
analysis/     generated reviews
```

## Config

API key via `OPENROUTER_API_KEY` env var or `~/.bujo-electron/config.json`.

Based on [bujo-ai](https://github.com/naungmon/bujo-ai).
