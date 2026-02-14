import type React from "react";
import { createPortal } from "react-dom";
import { ContextMenuContainer } from "@/components/context-menu-primitives.tsx";

export function ContextMenuPortal({
  x,
  y,
  menuRef,
  children,
}: {
  x: number;
  y: number;
  menuRef: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return createPortal(
    <ContextMenuContainer
      menuRef={menuRef}
      className="fixed z-50"
      style={{ left: x, top: y }}
    >
      {children}
    </ContextMenuContainer>,
    document.body,
  );
}
