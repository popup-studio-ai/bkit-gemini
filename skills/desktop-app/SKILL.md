---
name: desktop-app
description: |
  Desktop app development guide for cross-platform applications.
  Covers Electron and Tauri frameworks.

  Use proactively when user wants to build desktop applications.

  Triggers: desktop app, Electron, Tauri, mac app, windows app,
  데스크톱 앱, 데스크탑 앱,
  デスクトップアプリ, デスクトップ,
  桌面应用, 桌面程序,
  aplicación de escritorio, app de escritorio,
  application de bureau, app desktop,
  Desktop-Anwendung, Desktop-App,
  applicazione desktop, app desktop

  Do NOT use for: web-only projects, mobile apps
---

# Desktop App Skill

> Build cross-platform desktop applications

## Frameworks

### Tauri (Recommended)

Lightweight, secure, Rust-based.

```bash
# Create new Tauri project
npm create tauri-app
cd my-app
npm run tauri dev
```

**Pros:**
- Small bundle size (~5MB)
- High performance
- Better security
- Use any frontend framework

### Electron

Chromium-based, widely used.

```bash
# Create with electron-forge
npm init electron-app@latest my-app
cd my-app
npm start
```

**Pros:**
- Mature ecosystem
- Large community
- Easy to learn
- Full Node.js access

## Project Structure (Tauri)

```
my-app/
├── src/                  # Frontend (React, Vue, etc.)
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/            # Rust backend
│   ├── src/
│   │   └── main.rs
│   ├── tauri.conf.json
│   └── Cargo.toml
└── package.json
```

## Key Features

### System Tray

```rust
// src-tauri/src/main.rs
use tauri::SystemTray;

fn main() {
    let tray = SystemTray::new();

    tauri::Builder::default()
        .system_tray(tray)
        .run(tauri::generate_context!())
        .expect("error");
}
```

### Native Dialogs

```typescript
// Frontend
import { open, save } from '@tauri-apps/api/dialog';

async function openFile() {
  const selected = await open({
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });
  return selected;
}
```

### File System

```typescript
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

async function saveFile(path: string, content: string) {
  await writeTextFile(path, content);
}
```

## Deployment

- **macOS**: .dmg, .app
- **Windows**: .msi, .exe
- **Linux**: .deb, .AppImage

```bash
# Build for all platforms
npm run tauri build
```
