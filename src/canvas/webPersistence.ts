/**
 * File handling for the browser build, where there is no filesystem to write to.
 *
 * - Save is a download of a `.novello` blob.
 * - Open is a hidden `<input type="file">`.
 * - Every graph change is mirrored into localStorage so a refresh doesn't lose
 *   work. This autosave is a safety net, not a document: it has no name and is
 *   overwritten on every edit, including New.
 */
import type { CanvasNode, CanvasEdge } from "./nodesStore";
import { serialize, parse, type NovelloFile } from "./fileFormat";

const AUTOSAVE_KEY = "novello:autosave:v1";

export function ensureNovelloExtension(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Untitled.novello";
  return /\.(novello|json)$/i.test(trimmed) ? trimmed : `${trimmed}.novello`;
}

/** Trigger a browser download of `contents` as `filename`. */
export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Open a file picker and resolve with the chosen file's text, or null if cancelled. */
export function pickTextFile(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".novello,.json,application/json";
    input.style.display = "none";
    document.body.appendChild(input);

    let settled = false;
    const finish = (value: { name: string; text: string } | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      window.removeEventListener("focus", onFocus);
      resolve(value);
    };

    // "change" fires on pick. If the user cancels, no event fires at all, so we
    // fall back to the window regaining focus to resolve null and clean up.
    const onFocus = () => setTimeout(() => finish(null), 500);

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      file
        .text()
        .then((text) => finish({ name: file.name, text }))
        .catch(() => finish(null));
    });

    window.addEventListener("focus", onFocus);
    input.click();
  });
}

export function readAutosave(): NovelloFile | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return parse(raw);
  } catch {
    return null;
  }
}

export function writeAutosave(
  nodes: Record<string, CanvasNode>,
  edges: Record<string, CanvasEdge>,
): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serialize(nodes, edges));
  } catch {
    // Private mode, quota, or storage disabled. Autosave is best-effort.
  }
}
