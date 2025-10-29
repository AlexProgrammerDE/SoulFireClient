import { format, formatDistanceToNow } from "date-fns";
import { ClipboardIcon } from "lucide-react";
import React, { useMemo } from "react";
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
      <PopoverContent className="size-fit p-2 text-center text-sm select-text items-center">
        <time className="inline-flex align-middle" dateTime={isoString}>
          {formatted}
        </time>
        <span className="inline-flex select-none">{"\u202F"}</span>
        <ClipboardIcon
          className="cursor-pointer size-3 select-none inline-flex align-middle"
          onClick={() => {
            copyToClipboard(isoString);
          }}
        />
      </PopoverContent>
    </Popover>
  );
});
