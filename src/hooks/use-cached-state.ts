import { useState } from 'react';

export function useCachedState<T>(propValue: T): [T, (value: T) => void] {
  const [lastValue, setLastValue] = useState(propValue);
  const [currValue, setCurrValue] = useState(propValue);
  if (propValue !== lastValue) {
    setLastValue(propValue);
    setCurrValue(propValue);
  }

  return [
    currValue,
    (value: T) => {
      setCurrValue(value);
    },
  ];
}
