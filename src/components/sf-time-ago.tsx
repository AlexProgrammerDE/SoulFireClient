import ReactTimeago from 'react-timeago';
import * as React from 'react';

export function SFTimeAgo<T extends React.ElementType>(
  props: Omit<ReactTimeago.ReactTimeagoProps<T>, 'component'>,
) {
  return <ReactTimeago {...props} />;
}
