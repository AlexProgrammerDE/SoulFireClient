import React, { Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

export type LucideIconName = keyof typeof dynamicIconImports;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: LucideIconName;
}

const cache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

export function convertUnsafeIconName(name: string): LucideIconName {
  if (name in dynamicIconImports) {
    return name as LucideIconName;
  }

  throw new Error(`Invalid icon name: ${name}`);
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
  const LazyIcon = loadCachedIcon(name);

  return (
    <Suspense fallback={<div className={props.className} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
});

export default DynamicIcon;
