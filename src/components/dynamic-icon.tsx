import type { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import tags from "lucide-static/tags.json" with { type: "json" };
import React, { Suspense } from "react";

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

function convertUnsafeIconName(name: string): LucideIconName | null {
  if (name in dynamicIconImports) {
    return name as LucideIconName;
  }

  return null;
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

const FALLBACK_ICON: LucideIconName = "settings";

const DynamicIcon = React.memo(({ name, ...props }: IconProps) => {
  const iconName = convertUnsafeIconName(name) ?? FALLBACK_ICON;
  const LazyIcon = loadCachedIcon(iconName);

  return (
    <Suspense fallback={<div className={props.className} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
});

export default DynamicIcon;
