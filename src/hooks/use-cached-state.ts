import { useEffect, useState } from "react";

export function useCachedState<T>(
  propValue: T,
  options?: {
    shouldSync?: boolean;
  },
): [T, (value: T) => void] {
  const [currValue, setCurrValue] = useState(propValue);
  const shouldSync = options?.shouldSync ?? true;

  useEffect(() => {
    if (!shouldSync) {
      return;
    }

    setCurrValue(propValue);
  }, [propValue, shouldSync]);

  return [
    currValue,
    (value: T) => {
      setCurrValue(value);
    },
  ];
}
