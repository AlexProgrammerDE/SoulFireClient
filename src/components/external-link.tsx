import { openUrl } from "@tauri-apps/plugin-opener";
import type { AnchorHTMLAttributes, DetailedHTMLProps } from "react";
import { isTauri, runAsync } from "@/lib/utils.tsx";

export function ExternalLink(
  props: Omit<
    DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >,
    "target"
  > & {
    href: string;
  },
) {
  return (
    <a
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        if (isTauri()) {
          runAsync(async () => {
            await openUrl(props.href);
          });
        } else {
          window.open(props.href, "_blank");
        }
      }}
      target="_blank"
      {...props}
    />
  );
}
