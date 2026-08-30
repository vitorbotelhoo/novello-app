/**
 * Novello ships as a native macOS app but the same frontend also runs as a
 * plain web page (novello.vitor.ink). `isTauri()` is the one switch that tells
 * the two apart: native file dialogs, the window chrome, and the File menu only
 * exist under the Tauri shell; the browser build falls back to downloads,
 * a file picker, and localStorage autosave instead.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
