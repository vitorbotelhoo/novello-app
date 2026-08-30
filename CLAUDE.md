# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Novello is a working mind-mapping app, not a scaffold. The infinite canvas, nodes, thread connections, selection, undo/redo, local file persistence, a native File menu, and custom macOS window chrome are all implemented. See `../NOVELLO.md` (one level up) for the founding product vision, that's the source of truth for intent.

This will be a public, open-source repo. The same frontend is also deployed as a plain web app at `novello.vitor.ink` (see Web build below).

## Stack

- **Shell**: Tauri 2 (Rust backend in `src-tauri/`), packages as a native macOS `.app`, not a webapp. Uses the OS's WKWebView, no bundled browser engine.
- **Frontend**: React 19 + TypeScript, built with Vite.
- **State**: Zustand, several small stores rather than one global store.
- **Font**: TASA Explorer, self-hosted in `public/fonts/` (SIL OFL), wired up in `src/fonts.css`.
- **Package manager**: npm.

Rust is installed via rustup at `~/.cargo/bin`. `~/.zshenv` is root-owned and not writable by the user, so rustup could not add cargo to PATH there; the PATH export was added to `~/.zshrc` instead (`export PATH="$HOME/.cargo/bin:$PATH"`). New shells should pick it up automatically; if `cargo`/`rustc` aren't found, prepend `export PATH="$HOME/.cargo/bin:$PATH"` to the command.

## Commands

Run from this directory (`novello-app/`).

```bash
npm install           # install frontend deps
npm run tauri dev     # run the app in dev mode (opens a native window)
npm run dev           # vite dev server only, frontend without the native shell
npm run build         # tsc + vite build, frontend only, verifies TS types
npm run tauri build   # produce the release .app bundle
npm run release       # build + install to /Applications (see below)
```

Rust-side checks (from `src-tauri/`):

```bash
cargo check   # type-check the Rust backend without a full build
```

### Releasing to /Applications

Vitor runs Novello as a normal Dock app, from `/Applications/novello.app`. That copy is a frozen snapshot: it does not pick up code changes until it is rebuilt. `npm run release` (`scripts/release.sh`) does the whole cycle: build, quit the running app, replace the installed copy, re-sign, verify.

Two things that script exists to handle, don't undo them:

- It passes `--bundles app`. The default `targets: "all"` in `tauri.conf.json` also tries to build a `.dmg`, and `bundle_dmg.sh` fails without a real signing identity.
- It re-signs with `codesign --force --deep --sign -`. Tauri leaves only the linker's ad-hoc signature on the binary and never signs the bundle, so Gatekeeper rejects it with "code has no resources but signature indicates they must be present".

The signature is ad-hoc, so the built app is only trusted on the machine that built it. Distribution would need a real Developer ID and notarization.

### Web build (novello.vitor.ink)

The Vite frontend also ships as a static web app. Vercel project `novello` (team `vitorbotelho-projects`) is Git-connected to `github.com/vitorbotelhoo/novello-app`, production branch `main`, so every push to `main` deploys. `vercel.json` pins the Vite preset, an SPA rewrite, asset cache headers, and a strict same-origin CSP. `.vercelignore` keeps `src-tauri/` (multi-GB `target/`) out of CLI uploads. The `novello.vitor.ink` subdomain is auto-provisioned because `vitor.ink` sits on Vercel nameservers; the separate `vitor.ink` project is untouched.

`src/canvas/env.ts` `isTauri()` is the single switch between native and web. Outside Tauri:

- `fileCommands.ts` saves by downloading a `.novello` blob (name from a `prompt()`) and opens via a hidden file input, instead of the Tauri dialog + fs plugins.
- `useWebPersistence.ts` mirrors every graph change into `localStorage` (debounced) and restores it on load, so a refresh doesn't lose an unsaved map. It also adds a `beforeunload` guard.
- `useNativeMenu`, `useWindowChrome`, and `useWindowTitle` bail early (the last one sets `document.title` instead). Without those guards the browser build throws an unhandled rejection reaching into the missing Tauri IPC bridge on load.

There is no visible File UI on the web yet: New/Open/Save are keyboard-only (`Cmd+N`/`O`/`S`). Threads still use the old sine path; the dashed gradient stroke (step 5 in `../DESIGN_SYSTEM_PLAN.md`) is not done.

## Architecture

### Frontend

Everything lives under `src/canvas/`. `src/App.tsx` renders `<Canvas />` and nothing else.

`Canvas.tsx` is the composition root: it calls the behavior hooks and renders the layers (`CanvasGrid`, `EdgeLayer`, `NodeLayer`) plus the chrome (`TitleBar`, `Toolbar`, `ZoomIndicator`, `ShortcutsOverlay`).

Stores (Zustand, one concern each):

- `store.ts` viewport (x/y/zoom) and the `zoomAt` anchoring math.
- `nodesStore.ts` the graph itself, `nodes` and `edges` as id-keyed records. All mutations live here.
- `selectionStore.ts` selected node/edge ids and which node is being text-edited.
- `historyStore.ts` undo/redo as full graph snapshots, capped at 100.
- `fileStore.ts` current path and dirty flag.
- `toolStore.ts` select/hand tool, plus the space-held override.
- `uiStore.ts` shortcuts overlay visibility.
- `connectionDragStore.ts` ephemeral state for an in-progress connection drag.

Behavior is split into `use*` hooks (`useCanvasPan`, `useCanvasZoom`, `useCanvasKeyboard`, `useNodeDrag`, `useMarqueeSelect`, `useConnectionHandle`, and so on) that wire DOM events to store actions. Pure geometry helpers stay separate: `coords.ts`, `nodeBoundary.ts`, `threadPath.ts`, `zoomToFit.ts`, `viewportAnimation.ts`, `prng.ts`.

### Native side

- `src-tauri/src/main.rs` calls `novello_lib::run()` in `lib.rs`, which registers plugins, the invoke handler, and the menu.
- `src-tauri/src/window_chrome.rs` exposes `apply_window_chrome` and `reposition_traffic_lights`, driving `NSWindow` directly via objc.
- The File menu is built in `lib.rs` by taking `Menu::default()` and inserting a File submenu at index 1, which keeps the native Window menu (Minimize, Zoom, Fill, Center, Tile) intact. Menu items carry no accelerators; they emit a `menu-action` event that `useNativeMenu.ts` listens for. All keyboard shortcuts are handled in `useCanvasKeyboard`.
- `src-tauri/capabilities/default.json` is Tauri's permission system. Any new native API exposed to the frontend needs an entry. Filesystem reads/writes are currently scoped to `$HOME/**`.
- Frontend and backend talk over `invoke` (JS) / `#[tauri::command]` (Rust), not HTTP.

## Conventions

**Undo/redo**: mutations in `nodesStore` call `recordHistory()` *before* changing state, which pushes a pre-change snapshot. Drag is the exception: `useNodeDrag` captures a snapshot on pointerdown and pushes it via `pushSnapshot` on release, and only if the pointer actually passed the drag threshold. So a drag is one undo step rather than hundreds, and a plain click adds no history at all. `loadFile` and `clear` deliberately skip both history and the dirty flag.

**Shortcuts**: `shortcuts.ts` is a display-only registry feeding the tooltips and the `?` cheat sheet. It does not handle keys. Actual handling is in `useCanvasKeyboard.ts` and `useToolShortcuts.ts`. Adding a shortcut means editing both places.

**File format**: `.novello` files are JSON, `{ version: 1, nodes: [], edges: [] }`, see `fileFormat.ts`. `parse()` rejects unknown versions outright. Bump `CURRENT_VERSION` and add migration if the shape changes.

**Graceful degradation outside Tauri**: `isTauri()` (`src/canvas/env.ts`) gates every native code path. Hooks touching native APIs bail early outside the shell, and `fileCommands.ts` has a full browser fallback. See Web build above. Keep new native calls behind that check.

## Window chrome, handle with care

`window_chrome.rs` plus `useWindowChrome.ts` implement rounded corners, a hidden transparent title bar, and repositioned traffic lights by manipulating `NSWindow` directly. The git history has several revert commits here (`b71b865`, `baea8b8`): iterating by guess-and-check on this code repeatedly broke native window dragging, tiling, and the Window menu, in ways that don't show up until a human actually uses the window.

Don't guess-and-check visual or window-chrome changes. Research the actual AppKit behavior, plan the change, then have Vitor test it in the real app.

## The product

Novello (Portuguese for "thread/skein") is a free, open-source, fully-local mind-mapping tool: an infinite canvas for building complex, dynamic, interactive mind maps, with shortcut-driven tools and a polished feel. Possible git-based storage for maps.

Branding direction: the thread/connection metaphor shows up visually. Edges are wiggly, pastel, thread-like curves (Catmull-Rom through jittered waypoints, seeded per edge so they stay stable across renders), not plain connector lines. Nodes are fixed 3:4 pastel cards with a subtle tilt.
