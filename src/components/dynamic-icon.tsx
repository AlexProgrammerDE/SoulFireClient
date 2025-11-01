import type { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import tags from "lucide-static/tags.json" with { type: "json" };
import React, { Suspense } from "react";
import i18n from "@/lib/i18n";

export function getAllIconTags() {
  return Object.entries(tags);
}

export type LucideIconName = keyof typeof dynamicIconImports;

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const cache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

function convertUnsafeIconName(name: string): LucideIconName {
  if (name in dynamicIconImports) {
    return name as LucideIconName;
  }

  throw new Error(
    i18n.t("icon.invalidName", {
      name,
    }),
  );
}

function loadCachedIcon(name: LucideIconName) {
  const value = cache.get(name);
  if (value !== undefined) {
    return value;
  }

  const lazyValue = React.lazy(dynamicIconImports[name]);
  cache.set(name, lazyValue);
  return lazyValue;
}

const DynamicIcon = React.memo(({ name, ...props }: IconProps) => {
  const LazyIcon = loadCachedIcon(convertUnsafeIconName(name));

  return (
    <Suspense fallback={<div className={props.className} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
});

export default DynamicIcon;
