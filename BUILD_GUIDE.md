# VolumnBook — Developer Build & Packaging Guide

This guide details how to build, test, and package **VolumnBook** from source into a standalone Windows installer and portable application.

---

## 1. Prerequisites

On the development workstation:
- **Node.js**: v18.x, v20.x, or v22.x LTS.
- **npm**: v9.x or higher.
- **Git** (optional).
- Operating System: Windows 10/11 64-bit (or Linux/macOS with Wine installed for cross-compiling NSIS).

---

## 2. Setting Up the Development Workspace

```bash
# 1. Clone or extract project repository
cd VolumnBook

# 2. Install all dependencies
npm install

# 3. Start local development server
npm run dev
```

---

## 3. Launching Desktop Electron in Development

To run the full Electron desktop shell with active HMR:

```bash
# In terminal 1 (dev server):
npm run dev

# In terminal 2:
ELECTRON_START_URL=http://localhost:3000 npm run electron
```

---

## 4. Compiling the Production Build

```bash
# Compile TypeScript and Vite production assets
npm run build
```

This compiles static assets into the `dist/` directory.

---

## 5. Generating the Windows NSIS Installer

To package the complete offline Windows NSIS installer:

```bash
npm run dist
```

Output:
```text
dist_electron/
├── VolumnBook-Setup-1.0.0.exe      # Windows NSIS Installer
├── VolumnBook-Portable-1.0.0.exe   # Standalone Portable EXE
└── builder-effective-config.yaml   # Build diagnostics
```

---

## 6. Key Configuration Files

- `package.json`: Contains runtime dependencies (`better-sqlite3`, `xlsx`, `docx`, `jspdf`, `lucide-react`) and packaging scripts.
- `electron-builder.yml`: Defines NSIS settings, desktop shortcut flags, installation directory logic, and target architectures (`x64`).
- `electron/main.cjs`: Electron process configuration, window management, and native bridge.
- `electron/preload.cjs`: Secure bridge with `contextIsolation: true`.
