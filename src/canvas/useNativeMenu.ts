import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { saveFile, saveAs, openFile, newMap } from "./fileCommands";

/** Native File menu items have no accelerators of their own; keyboard shortcuts are handled entirely in useCanvasKeyboard. */
export function useNativeMenu() {
  useEffect(() => {
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
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);
}
