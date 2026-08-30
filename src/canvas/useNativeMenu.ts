import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "./env";
import { saveFile, saveAs, openFile, newMap } from "./fileCommands";

/** Native File menu items have no accelerators of their own; keyboard shortcuts are handled entirely in useCanvasKeyboard. */
export function useNativeMenu() {
  useEffect(() => {
    // The browser build has no native menu. Calling listen() there would reach
    // into a missing Tauri IPC bridge and reject unobserved.
    if (!isTauri()) return;

    const unlisten = listen<string>("menu-action", (event) => {
      switch (event.payload) {
        case "menu-new":
          newMap();
          break;
        case "menu-open":
          void openFile();
          break;
        case "menu-save":
          void saveFile();
          break;
        case "menu-save-as":
          void saveAs();
          break;
      }
    }).catch(() => () => {});

    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);
}
