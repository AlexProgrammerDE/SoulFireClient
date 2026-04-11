import { useIsMobile } from "@/hooks/use-mobile.ts";
import { isDesktopTauri } from "@/lib/platform.ts";
import { isTauri } from "@/lib/utils.tsx";

export const WINDOW_TITLEBAR_HEIGHT = "2rem";

export function useShouldShowWindowTitlebar() {
  const isMobile = useIsMobile();
  const desktopTauri = isDesktopTauri();

  return desktopTauri || (!isTauri() && !isMobile);
}
