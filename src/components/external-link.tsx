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
    href?: string;
  },
) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is an external link with custom open behavior
    <a
      // biome-ignore lint/a11y/useValidAnchor: This is an external link with custom open behavior
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        const href = props.href;
        if (href) {
          if (isTauri()) {
            runAsync(async () => {
              await openUrl(href);
            });
          } else {
            window.open(href, "_blank");
          }
        }
      }}
      target="_blank"
      {...props}
    />
  );
}
