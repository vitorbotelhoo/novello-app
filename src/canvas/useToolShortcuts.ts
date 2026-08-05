import { useEffect } from "react";
import { useToolStore } from "./toolStore";

export function useToolShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        useToolStore.getState().setSpaceHeld(true);
        return;
      }

      if (e.key === "v" || e.key === "V") {
        useToolStore.getState().setTool("select");
      } else if (e.key === "h" || e.key === "H") {
        useToolStore.getState().setTool("hand");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        useToolStore.getState().setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
