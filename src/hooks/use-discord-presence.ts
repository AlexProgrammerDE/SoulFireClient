import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import { isTauri } from "@/lib/utils.tsx";

export function useDiscordPresence(state: string, details?: string) {
  const prevState = useRef<string>(undefined);
  const prevDetails = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isTauri()) return;
    if (state === prevState.current && details === prevDetails.current) return;

    prevState.current = state;
    prevDetails.current = details;

    void invoke("update_discord_activity", {
      state,
      details: details ?? null,
    });
  }, [state, details]);
}
