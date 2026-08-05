// Single source of truth for shortcut DISPLAY (tooltips + cheat-sheet overlay).
// The actual key handling lives in useCanvasKeyboard / useToolShortcuts — keep
// this registry in sync with those handlers when adding or changing a shortcut.

export interface Shortcut {
  keys: string;
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Tools",
    items: [
      { keys: "V", label: "Select tool" },
      { keys: "H", label: "Hand tool" },
      { keys: "Space", label: "Pan (hold)" },
    ],
  },
  {
    title: "Create & edit",
    items: [
      { keys: "Double-click", label: "New node" },
      { keys: "Tab", label: "Add connected child" },
      { keys: "Enter", label: "Edit node" },
      { keys: "⌘D", label: "Duplicate" },
      { keys: "⌫", label: "Delete selection" },
    ],
  },
  {
    title: "Select & move",
    items: [
      { keys: "⇧ Click", label: "Add to selection" },
      { keys: "Drag", label: "Marquee select" },
      { keys: "⌘A", label: "Select all" },
      { keys: "Esc", label: "Deselect / cancel" },
      { keys: "Arrows", label: "Move selection / pan" },
      { keys: "⇧ Arrows", label: "Move / pan faster" },
    ],
  },
  {
    title: "History",
    items: [
      { keys: "⌘Z", label: "Undo" },
      { keys: "⇧⌘Z", label: "Redo" },
    ],
  },
  {
    title: "View",
    items: [
      { keys: "⌘0", label: "Reset view" },
      { keys: "⌘1", label: "Fit to content" },
      { keys: "⌘2", label: "Fit to selection" },
      { keys: "+ / −", label: "Zoom in / out" },
    ],
  },
  {
    title: "File",
    items: [
      { keys: "⌘N", label: "New" },
      { keys: "⌘O", label: "Open" },
      { keys: "⌘S", label: "Save" },
      { keys: "⇧⌘S", label: "Save as" },
    ],
  },
  {
    title: "Help",
    items: [{ keys: "?", label: "Toggle this panel" }],
  },
];

/** Shortcut key labels for tooltips, by action id. */
export const SHORTCUT_KEYS = {
  select: "V",
  hand: "H",
  fitContent: "⌘1",
  fitSelected: "⌘2",
} as const;
