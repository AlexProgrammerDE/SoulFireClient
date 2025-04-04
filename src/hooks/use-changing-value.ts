import { useEffect, useState } from 'react';
import { deepEqual } from '@tanstack/react-router';

export function useChangingData<T>(
  produce: () => T,
  interval: number = 1000,
  deps: unknown[] = [],
): T {
  const [value, setValue] = useState(produce());

  useEffect(() => {
    function checkUpdate() {
      setValue((previous) => {
        const next = produce();
        return deepEqual(previous, next) ? previous : next;
      });
    }

    checkUpdate();
    const timer = setInterval(checkUpdate, interval);

    return () => clearInterval(timer);
  }, [interval, ...deps]);

  return value;
}
