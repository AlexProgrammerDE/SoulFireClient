import React, { Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports;
}

const cache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

function loadCachedIcon(name: keyof typeof dynamicIconImports) {
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
