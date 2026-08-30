import { useEffect } from "react";
import { isTauri } from "./env";
import { useNodesStore } from "./nodesStore";
import { useFileStore } from "./fileStore";
import { readAutosave, writeAutosave } from "./webPersistence";

const AUTOSAVE_DEBOUNCE_MS = 600;

/**
 * Browser-only glue: restore the last autosaved map on load, mirror every graph
 * change back into localStorage, and warn before leaving with unsaved changes.
 * Does nothing under the Tauri shell, which has real files and OS-level prompts.
 */
export function useWebPersistence() {
  useEffect(() => {
    if (isTauri()) return;

    // Restore: only into a fresh, empty, unsaved session.
    const { nodes, edges } = useNodesStore.getState();
    const isEmpty = Object.keys(nodes).length === 0 && Object.keys(edges).length === 0;
    if (isEmpty && !useFileStore.getState().currentPath) {
      const saved = readAutosave();
      if (saved && saved.nodes.length > 0) {
        useNodesStore.getState().loadFile(saved.nodes, saved.edges);
        useFileStore.getState().markClean();
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useNodesStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes && state.edges === prev.edges) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        writeAutosave(useNodesStore.getState().nodes, useNodesStore.getState().edges);
      }, AUTOSAVE_DEBOUNCE_MS);
    });

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!useFileStore.getState().isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);
}
