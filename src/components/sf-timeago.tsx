import { useDateFnsLocale } from '@/hooks/use-date-fns-locale.ts';
import { useChangingData } from '@/hooks/use-changing-value.ts';
import { format, formatDistanceToNow } from 'date-fns';
import React, { useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';

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
  }, [dateFnsLocale]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link">{baseText}</Button>
      </PopoverTrigger>
      <PopoverContent className="text-center w-fit">
        <time dateTime={props.date.toISOString()}>{formatted}</time>
      </PopoverContent>
    </Popover>
  );
});
