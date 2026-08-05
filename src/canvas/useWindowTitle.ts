import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useFileStore } from "./fileStore";

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  const last = parts[parts.length - 1] || path;
  return last.replace(/\.(novello|json)$/i, "");
}

export function useWindowTitle() {
  const currentPath = useFileStore((s) => s.currentPath);
  const isDirty = useFileStore((s) => s.isDirty);

  useEffect(() => {
    const name = currentPath ? basename(currentPath) : "Untitled";
    const title = `${isDirty ? "• " : ""}${name} - novello`;
    void getCurrentWindow().setTitle(title);
  }, [currentPath, isDirty]);
}
