import { useEffect, useRef } from "react";
import { desktop, isDesktopApp } from "@/lib/desktop.ts";

export function useDiscordPresence(state: string, details?: string) {
  const prevState = useRef<string>(undefined);
  const prevDetails = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isDesktopApp()) return;
    if (state === prevState.current && details === prevDetails.current) return;

    prevState.current = state;
    prevDetails.current = details;

    void desktop.discord.updateActivity(state, details ?? null);
  }, [state, details]);
}
