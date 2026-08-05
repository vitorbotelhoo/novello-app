import { save, open, message } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { useNodesStore } from "./nodesStore";
import { useFileStore } from "./fileStore";
import { useSelectionStore } from "./selectionStore";
import { useHistoryStore } from "./historyStore";
import { useCanvasStore } from "./store";
import { serialize, parse } from "./fileFormat";

const FILE_FILTERS = [{ name: "Novello map", extensions: ["novello", "json"] }];

export async function saveAs(): Promise<void> {
  const path = await save({ filters: FILE_FILTERS, defaultPath: "Untitled.novello" });
  if (!path) return;

  try {
    const { nodes, edges } = useNodesStore.getState();
    await writeTextFile(path, serialize(nodes, edges));
    useFileStore.getState().setCurrentPath(path);
    useFileStore.getState().markClean();
  } catch (err) {
    await message(`Couldn't save the file: ${String(err)}`, { title: "Save failed", kind: "error" });
  }
}

export async function saveFile(): Promise<void> {
  const currentPath = useFileStore.getState().currentPath;
  if (!currentPath) {
    await saveAs();
    return;
  }

  try {
    const { nodes, edges } = useNodesStore.getState();
    await writeTextFile(currentPath, serialize(nodes, edges));
    useFileStore.getState().markClean();
  } catch (err) {
    await message(`Couldn't save the file: ${String(err)}`, { title: "Save failed", kind: "error" });
  }
}

export async function openFile(): Promise<void> {
  const path = await open({ multiple: false, directory: false, filters: FILE_FILTERS });
  if (!path || Array.isArray(path)) return;

  try {
    const content = await readTextFile(path);
    const { nodes, edges } = parse(content);
    useNodesStore.getState().loadFile(nodes, edges);
    useSelectionStore.getState().clearSelection();
    useHistoryStore.getState().clear();
    useFileStore.getState().setCurrentPath(path);
    useFileStore.getState().markClean();
  } catch (err) {
    await message(`Couldn't open that file: ${String(err)}`, { title: "Open failed", kind: "error" });
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
