import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Applies novello's custom macOS window chrome (rounded corners, transparent
 * hidden title bar, repositioned traffic lights) once the webview is mounted.
 * No-op outside the Tauri shell (e.g. plain browser dev).
 */
export function useWindowChrome() {
  useEffect(() => {
    invoke("apply_window_chrome", {
      cornerRadius: 18,
      offsetX: 6,
      offsetY: 8,
    }).catch(() => {
      // Not running under the native shell; nothing to style.
    });
  }, []);
}
