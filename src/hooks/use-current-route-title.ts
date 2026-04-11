import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { resolveRouteIcon, resolveRouteTitle } from "@/lib/route-title.ts";

export function useCurrentRouteTitle() {
  useTranslation();

  return useRouterState({
    select: (state) => resolveRouteTitle(state.matches),
  });
}

export function useCurrentRouteChrome() {
  useTranslation();

  return useRouterState({
    select: (state) => {
      const title = resolveRouteTitle(state.matches);

      return {
        title,
        icon: resolveRouteIcon(state.matches, title),
      };
    },
  });
}
