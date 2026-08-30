import { save, open, message } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { useNodesStore } from "./nodesStore";
import { useFileStore } from "./fileStore";
import { useSelectionStore } from "./selectionStore";
import { useHistoryStore } from "./historyStore";
import { useCanvasStore } from "./store";
import { serialize, parse } from "./fileFormat";
import { isTauri } from "./env";
import { downloadTextFile, pickTextFile, ensureNovelloExtension } from "./webPersistence";

const FILE_FILTERS = [{ name: "Novello map", extensions: ["novello", "json"] }];

/** Replace the current graph with a parsed file and reset the surrounding state. */
function applyLoadedFile(content: string, pathOrName: string): void {
  const { nodes, edges } = parse(content);
  useNodesStore.getState().loadFile(nodes, edges);
  useSelectionStore.getState().clearSelection();
  useHistoryStore.getState().clear();
  useFileStore.getState().setCurrentPath(pathOrName);
  useFileStore.getState().markClean();
}

async function reportError(kind: "save" | "open", err: unknown): Promise<void> {
  const text =
    kind === "save"
      ? `Couldn't save the file: ${String(err)}`
      : `Couldn't open that file: ${String(err)}`;
  if (isTauri()) {
    await message(text, { title: kind === "save" ? "Save failed" : "Open failed", kind: "error" });
  } else {
    window.alert(text);
  }
}

export async function saveAs(): Promise<void> {
  const { nodes, edges } = useNodesStore.getState();
  const contents = serialize(nodes, edges);

  if (!isTauri()) {
    const current = useFileStore.getState().currentPath;
    const suggested = current ?? "Untitled.novello";
    const chosen = window.prompt("Save map as", suggested);
    if (chosen === null) return;
    const filename = ensureNovelloExtension(chosen);
    try {
      downloadTextFile(filename, contents);
      useFileStore.getState().setCurrentPath(filename);
      useFileStore.getState().markClean();
    } catch (err) {
      await reportError("save", err);
    }
    return;
  }

  const path = await save({ filters: FILE_FILTERS, defaultPath: "Untitled.novello" });
  if (!path) return;

  try {
    await writeTextFile(path, contents);
    useFileStore.getState().setCurrentPath(path);
    useFileStore.getState().markClean();
  } catch (err) {
    await reportError("save", err);
  }
}

export async function saveFile(): Promise<void> {
  const currentPath = useFileStore.getState().currentPath;
  if (!currentPath) {
    await saveAs();
    return;
  }

  const { nodes, edges } = useNodesStore.getState();
  const contents = serialize(nodes, edges);

  if (!isTauri()) {
    // No real path in the browser; re-download under the name we already have.
    try {
      downloadTextFile(currentPath, contents);
      useFileStore.getState().markClean();
    } catch (err) {
      await reportError("save", err);
    }
    return;
  }

  try {
    await writeTextFile(currentPath, contents);
    useFileStore.getState().markClean();
  } catch (err) {
    await reportError("save", err);
  }
}

export async function openFile(): Promise<void> {
  if (!isTauri()) {
    const picked = await pickTextFile();
    if (!picked) return;
    try {
      applyLoadedFile(picked.text, picked.name);
    } catch (err) {
      await reportError("open", err);
    }
    return;
  }

  const path = await open({ multiple: false, directory: false, filters: FILE_FILTERS });
  if (!path || Array.isArray(path)) return;

  try {
    const content = await readTextFile(path);
    applyLoadedFile(content, path);
  } catch (err) {
    await reportError("open", err);
  }
}

export function newMap(): void {
  useNodesStore.getState().clear();
  useSelectionStore.getState().clearSelection();
  useHistoryStore.getState().clear();
  useCanvasStore.getState().reset();
  useFileStore.getState().setCurrentPath(null);
  useFileStore.getState().markClean();
}
