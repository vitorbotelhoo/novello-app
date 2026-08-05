import type { ReactNode } from "react";
import "./Tooltip.css";

interface TooltipProps {
  label: string;
  shortcut?: string;
  children: ReactNode;
}

/** Hover tooltip shown above the trigger, with an optional shortcut badge. */
export function Tooltip({ label, shortcut, children }: TooltipProps) {
  return (
    <span className="novello-tooltip-wrap">
      {children}
      <span className="novello-tooltip" role="tooltip">
        <span className="novello-tooltip-label">{label}</span>
        {shortcut ? <span className="novello-tooltip-key">{shortcut}</span> : null}
      </span>
    </span>
  );
}
