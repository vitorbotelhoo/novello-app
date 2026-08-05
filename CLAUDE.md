# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Novello has a working Tauri + React/TypeScript scaffold, but no product features yet. `src/App.tsx` is still the default create-tauri-app greeting screen. See `../NOVELLO.md` (one level up) for the founding product vision, that's the source of truth for intent.

This will be a public, open-source repo.

## Stack

- **Shell**: Tauri 2 (Rust backend in `src-tauri/`), packages as a native macOS `.app`, not a webapp. Uses the OS's WKWebView, no bundled browser engine.
- **Frontend**: React 19 + TypeScript, built with Vite.
- **Package manager**: npm.

Rust is installed via rustup at `~/.cargo/bin`. `~/.zshenv` is root-owned and not writable by the user, so rustup could not add cargo to PATH there; the PATH export was added to `~/.zshrc` instead (`export PATH="$HOME/.cargo/bin:$PATH"`). New shells should pick it up automatically; if `cargo`/`rustc` aren't found, prepend `export PATH="$HOME/.cargo/bin:$PATH"` to the command.

## Commands

Run from this directory (`novello-app/`).

```bash
npm install           # install frontend deps
npm run tauri dev     # run the app in dev mode (opens a native window)
npm run dev            # vite dev server only, frontend without the native shell
npm run build           # tsc + vite build, frontend only, verifies TS types
npm run tauri build    # produce the release .app bundle
```

Rust-side checks (from `src-tauri/`):

```bash
cargo check   # type-check the Rust backend without a full build
```

## Architecture

- `src/` — React/TypeScript frontend. Entry point `src/main.tsx`, root component `src/App.tsx`.
- `src-tauri/` — Rust backend. `src-tauri/src/main.rs` calls into `novello_lib::run()` (defined in `src-tauri/src/lib.rs`), which is where Tauri commands and native-side logic get registered.
- `src-tauri/tauri.conf.json` — app identifier (`com.novello.app`), window config, bundle targets.
- `src-tauri/capabilities/` — Tauri's permission system; any new native API surface exposed to the frontend needs a capability entry here.
- Frontend and backend communicate via Tauri's `invoke` (JS) / `#[tauri::command]` (Rust) bridge, not HTTP.

## The product

Novello (Portuguese for "thread/skein") is a planned free, open-source, fully-local mind-mapping tool: an infinite canvas for building complex, dynamic, interactive mind maps, with shortcut-driven tools and a polished feel. Possible git-based storage for maps.

Branding direction: the thread/connection metaphor should show up visually, e.g. pastel-colored or wiggly, thread-like lines rather than plain connector lines.
