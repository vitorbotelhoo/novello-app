import { useFileStore } from "./fileStore";
import "./TitleBar.css";

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  const last = parts[parts.length - 1] || path;
  return last.replace(/\.(novello|json)$/i, "");
}

export function TitleBar() {
  const currentPath = useFileStore((s) => s.currentPath);
  const isDirty = useFileStore((s) => s.isDirty);

  const name = currentPath ? basename(currentPath) : "Untitled";
  const titleText = `${isDirty ? "• " : ""}${name}`;

  return (
    <div className="novello-titlebar" data-tauri-drag-region>
      <span className="novello-titlebar-title" data-tauri-drag-region>
        {titleText}
      </span>
    </div>
  );
}
