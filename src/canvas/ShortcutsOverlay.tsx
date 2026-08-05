import { useUiStore } from "./uiStore";
import { SHORTCUT_GROUPS } from "./shortcuts";
import "./ShortcutsOverlay.css";

export function ShortcutsOverlay() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const toggle = useUiStore((s) => s.toggleShortcuts);
  const close = useUiStore((s) => s.closeShortcuts);

  return (
    <>
      <button
        type="button"
        className="novello-help-button"
        aria-label="Keyboard shortcuts"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
      >
        ?
      </button>

      {open ? (
        <div
          className="novello-shortcuts-backdrop"
          onPointerDown={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          <div className="novello-shortcuts-panel" onPointerDown={(e) => e.stopPropagation()}>
            <div className="novello-shortcuts-header">Keyboard shortcuts</div>
            <div className="novello-shortcuts-grid">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title} className="novello-shortcuts-group">
                  <div className="novello-shortcuts-group-title">{group.title}</div>
                  {group.items.map((item) => (
                    <div key={item.label} className="novello-shortcuts-row">
                      <span className="novello-shortcuts-label">{item.label}</span>
                      <span className="novello-shortcuts-keys">{item.keys}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
