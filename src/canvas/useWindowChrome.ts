import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const CHROME = { cornerRadius: 18, offsetX: 6, offsetY: 8 };

/**
 * Applies novello's custom macOS window chrome (rounded corners, transparent
 * hidden title bar, repositioned traffic lights) once the webview is mounted,
 * and re-pins the traffic lights on resize (macOS resets them otherwise).
 * No-op outside the Tauri shell (e.g. plain browser dev).
 */
export function useWindowChrome() {
  useEffect(() => {
    invoke("apply_window_chrome", CHROME).catch(() => {
      // Not running under the native shell; nothing to style.
    });

    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        unlisten = await getCurrentWindow().onResized(() => {
          invoke("reposition_traffic_lights", {
            offsetX: CHROME.offsetX,
            offsetY: CHROME.offsetY,
          }).catch(() => {});
        });
      } catch {
        // Not under Tauri; no window to track.
      }
    })();

    return () => unlisten?.();
  }, []);
}
