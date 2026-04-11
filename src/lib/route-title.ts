const APP_TITLE = "SoulFire";

type RouteTitleMatch = {
  context: unknown;
  loaderData?: unknown;
  params: Record<string, string>;
};

export type RouteTitleResolver = (
  match: RouteTitleMatch,
) => null | string | undefined;

export function buildDocumentTitle(pageTitle?: null | string) {
  const normalizedTitle = pageTitle?.trim();

  if (!normalizedTitle || normalizedTitle === APP_TITLE) {
    return APP_TITLE;
  }

  return `${normalizedTitle} | ${APP_TITLE}`;
}

export function routeTitle(getTitle: RouteTitleResolver) {
  return { getTitle };
}

export function staticRouteTitle(title: (() => string) | string) {
  return routeTitle(() => (typeof title === "function" ? title() : title));
}

export function resolveRouteTitle(
  matches: Array<{
    context: unknown;
    loaderData?: unknown;
    params: Record<string, string>;
  }>,
) {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const getTitle = (match.context as { getTitle?: unknown }).getTitle;

    if (typeof getTitle !== "function") {
      continue;
    }

    const resolvedTitle = (getTitle as RouteTitleResolver)(match);
    if (typeof resolvedTitle === "string" && resolvedTitle.trim()) {
      return resolvedTitle.trim();
    }
  }

  return APP_TITLE;
}

export { APP_TITLE };
