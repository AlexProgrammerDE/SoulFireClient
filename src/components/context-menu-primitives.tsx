import type React from "react";
import { cn } from "@/lib/utils.tsx";

export function MenuItem({
  className,
  variant = "default",
  onClick,
  children,
}: {
  className?: string;
  variant?: "default" | "destructive";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-variant={variant}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 data-[variant=destructive]:hover:text-destructive gap-2 rounded-sm px-2 py-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MenuSeparator({ className }: { className?: string }) {
  return <div className={cn("bg-border -mx-1 my-1 h-px", className)} />;
}

export function MenuShortcut({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ContextMenuContainer({
  className,
  style,
  menuRef,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  menuRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: context menu is mouse-triggered
    // biome-ignore lint/a11y/noStaticElementInteractions: context menu container
    <div
      ref={menuRef}
      style={style}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-md p-1 shadow-md ring-1",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
