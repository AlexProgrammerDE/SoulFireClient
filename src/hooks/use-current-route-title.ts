import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { resolveRouteTitle } from "@/lib/route-title.ts";

export function useCurrentRouteTitle() {
  useTranslation();

  return useRouterState({
    select: (state) => resolveRouteTitle(state.matches),
  });
}
