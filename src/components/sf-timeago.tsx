import { useDateFnsLocale } from '@/hooks/use-date-fns-locale.ts';
import { useChangingData } from '@/hooks/use-changing-value.ts';
import { format, formatDistanceToNow } from 'date-fns';
import React, { useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';

export const SFTimeAgo = React.memo((props: { date: Date }) => {
  const dateFnsLocale = useDateFnsLocale();
  const baseText = useChangingData(
    () =>
      formatDistanceToNow(props.date, {
        addSuffix: true,
        includeSeconds: true,
        locale: dateFnsLocale,
      }),
    1_000,
    [props.date, dateFnsLocale],
  );
  const formatted = useMemo(() => {
    return format(props.date, 'PPpp', { locale: dateFnsLocale });
  }, [props.date, dateFnsLocale]);

  return (
    <Popover>
      <PopoverTrigger>{baseText}</PopoverTrigger>
      <PopoverContent className="size-fit p-2 text-center text-sm">
        <time dateTime={props.date.toISOString()}>{formatted}</time>
      </PopoverContent>
    </Popover>
  );
});
