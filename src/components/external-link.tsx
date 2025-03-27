import { AnchorHTMLAttributes, DetailedHTMLProps } from 'react';

export function ExternalLink(
  props: Omit<
    DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >,
    'target'
  >,
) {
  return <a target="_blank" {...props} />;
}
