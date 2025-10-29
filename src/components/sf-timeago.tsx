import { format, formatDistanceToNow } from "date-fns";
import { ClipboardIcon } from "lucide-react";
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { useChangingData } from "@/hooks/use-changing-value.ts";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.ts";
import { useDateFnsLocale } from "@/hooks/use-date-fns-locale.ts";

export const SFTimeAgo = React.memo((props: { date: Date }) => {
  const dateFnsLocale = useDateFnsLocale();
  const copyToClipboard = useCopyToClipboard();
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
    return format(props.date, "PPpp", { locale: dateFnsLocale });
  }, [props.date, dateFnsLocale]);
  const isoString = props.date.toISOString();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>{baseText}</span>
      </PopoverTrigger>
      <PopoverContent className="flex flex-row gap-1 size-fit p-2 items-center">
        <time className="select-text text-center text-sm" dateTime={isoString}>
          {formatted}
        </time>
        <Button variant="outline" size="icon">
          <ClipboardIcon
            className="cursor-pointer select-none"
            onClick={() => {
              copyToClipboard(isoString);
            }}
          />
        </Button>
      </PopoverContent>
    </Popover>
  );
});
