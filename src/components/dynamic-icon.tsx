import React, { Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import loadable from '@loadable/component';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports;
}

const mappedImports = Object.entries(dynamicIconImports).reduce(
  (acc, [name, importFn]) => {
    acc[name as unknown as keyof typeof dynamicIconImports] = loadable(
      importFn,
      {
        cacheKey: () => name,
      },
    );
    return acc;
  },
  {} as Record<keyof typeof dynamicIconImports, ReturnType<typeof loadable>>,
);

const DynamicIcon = ({ name, ...props }: IconProps) => {
  const LucideIcon = mappedImports[name];

  return (
    <Suspense fallback={<div className={props.className} />}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

export default DynamicIcon;
