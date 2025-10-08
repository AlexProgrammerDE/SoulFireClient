import { flavorEntries } from "@catppuccin/palette";
import { stripAnsi } from "fancy-ansi";
import { AnsiHtml } from "fancy-ansi/react";
import React, {
  type CSSProperties,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { TerminalThemeContext } from "@/components/providers/terminal-theme-context.tsx";
import { LogsServiceClient } from "@/generated/soulfire/logs.client.ts";
import type { LogScope } from "@/generated/soulfire/logs.ts";
import { isDemo } from "@/lib/utils.tsx";
import { TransportContext } from "./providers/transport-context.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";

const MAX_TERMINAL_LINES = 500;

const MemoAnsiHtml = React.memo((props: { text: string }) => {
  return (
    <AnsiHtml
      text={
        stripAnsi(props.text).endsWith("\n") ? props.text : `${props.text}\n`
      }
    />
  );
});

function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function convertLine(message: TerminalLineBase): TerminalLine {
  return {
    id: message.id,
    message: message.message,
    lines: message.message.split("\n").length,
    hash: fnv1aHash(message.message),
  };
}

function limitLength(lines: TerminalLine[]): TerminalLine[] {
  // Cut from start until we are <= max lines
  let linesSum = lines.reduce((acc, curr) => acc + curr.lines, 0);
  while (linesSum > MAX_TERMINAL_LINES) {
    linesSum -= lines[0].lines;
    lines = lines.slice(1);
  }

  return lines;
}

function deduplicateConsecutive<T>(
  arr: T[],
  getHash: (item: T) => string,
): T[] {
  return arr.reduce<T[]>((result, item, index) => {
    if (index === 0 || getHash(item) !== getHash(arr[index - 1])) {
      result.push(item);
    }
    return result;
  }, []);
}

type TerminalLineBase = {
  id: string;
  message: string;
};

type TerminalLine = TerminalLineBase & {
  lines: number;
  hash: string;
};

export const TerminalComponent = (props: { scope: LogScope }) => {
  const { t } = useTranslation("common");
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<TerminalLine[]>(
    isDemo()
      ? [
          convertLine({
            id: "demo-1",
            message: t("terminal.demo-1"),
          }),
          convertLine({
            id: "demo-2",
            message: t("terminal.demo-2"),
          }),
          convertLine({
            id: "demo-3",
            message: t("terminal.demo-3"),
          }),
          convertLine({
            id: "demo-4",
            message: t("terminal.demo-4"),
          }),
        ]
      : [],
  );
  const transport = use(TransportContext);
  const terminalTheme = use(TerminalThemeContext);
  const paneRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const selectedTheme = flavorEntries.find(
    (entry) => entry[0] === terminalTheme.value,
  )?.[1];

  const handleScroll = useCallback(() => {
    if (paneRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = paneRef.current;
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    }
  }, []);

  useEffect(() => {
    const pane = paneRef.current;
    if (pane) {
      pane.addEventListener("scroll", handleScroll);
      return () => {
        pane.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottom && paneRef.current) {
      paneRef.current.scrollTop = paneRef.current.scrollHeight;
    }
  }, [isAtBottom]);

  useEffect(() => {
    if (gotPrevious) {
      return;
    }

    if (transport === null) {
      return;
    }

    const abortController = new AbortController();
    const logsService = new LogsServiceClient(transport);
    void logsService
      .getPrevious(
        {
          scope: props.scope,
          // Max allowed amount of entries by the server
          count: 300,
        },
        {
          abort: abortController.signal,
        },
      )
      .then((call) => {
        if (call.response.messages.length === 0) {
          setEntries((prev) => [
            ...prev,
            convertLine({
              id: "empty",
              message: t("terminal.noLogs"),
            }),
          ]);
        }

        for (const message of call.response.messages) {
          setEntries((prev) => {
            return deduplicateConsecutive(
              limitLength([...prev, convertLine(message)]),
              (element) => element.hash,
            );
          });
        }
        setGotPrevious(true);
      });

    return () => {
      abortController.abort();
    };
  }, [gotPrevious, props.scope, t, transport]);

  useEffect(() => {
    const abortController = new AbortController();

    function connect() {
      if (transport === null) {
        return;
      }

      console.info("Connecting to logs service");
      const logsService = new LogsServiceClient(transport);
      const { responses } = logsService.subscribe(
        {
          scope: props.scope,
        },
        {
          abort: abortController.signal,
        },
      );

      responses.onError((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error(error);
        setTimeout(() => {
          if (abortController.signal.aborted) {
            return;
          }

          connect();
        }, 3_000);
      });
      responses.onComplete(() => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Stream completed");
        setTimeout(() => {
          if (abortController.signal.aborted) {
            return;
          }

          connect();
        }, 1000);
      });
      responses.onMessage((response) => {
        const message = response.message;
        if (message === undefined) {
          return;
        }

        setEntries((prev) => {
          return deduplicateConsecutive(
            limitLength([
              ...prev.filter((entry) => entry.id !== "empty"),
              convertLine(message),
            ]),
            (element) => element.hash,
          );
        });
      });
    }

    connect();

    return () => {
      abortController.abort();
    };
  }, [props.scope, transport]);

  return (
    <ScrollArea
      viewportRef={paneRef}
      className="h-[calc(75vh-8rem)] rounded-md pr-4 font-mono text-xs"
      style={
        {
          backgroundColor: selectedTheme.colors.base.hex,
          color: selectedTheme.colors.text.hex,
          "--color-border": `${selectedTheme.colors.surface2.hex}80`, // Add 50% opacity
          "--ansi-black": selectedTheme.dark
            ? selectedTheme.colors.surface1.hex
            : selectedTheme.colors.subtext1.hex,
          "--ansi-red": selectedTheme.colors.red.hex,
          "--ansi-green": selectedTheme.colors.green.hex,
          "--ansi-yellow": selectedTheme.colors.yellow.hex,
          "--ansi-blue": selectedTheme.colors.blue.hex,
          "--ansi-magenta": selectedTheme.colors.pink.hex,
          "--ansi-cyan": selectedTheme.colors.teal.hex,
          "--ansi-white": selectedTheme.dark
            ? selectedTheme.colors.subtext0.hex
            : selectedTheme.colors.surface2.hex,
          "--ansi-bright-black": selectedTheme.dark
            ? selectedTheme.colors.surface2.hex
            : selectedTheme.colors.subtext0.hex,
          "--ansi-bright-red": selectedTheme.colors.red.hex,
          "--ansi-bright-green": selectedTheme.colors.green.hex,
          "--ansi-bright-yellow": selectedTheme.colors.yellow.hex,
          "--ansi-bright-blue": selectedTheme.colors.blue.hex,
          "--ansi-bright-magenta": selectedTheme.colors.pink.hex,
          "--ansi-bright-cyan": selectedTheme.colors.teal.hex,
          "--ansi-bright-white": selectedTheme.dark
            ? selectedTheme.colors.subtext1.hex
            : selectedTheme.colors.surface1.hex,
          "--terminal-selection-bg": selectedTheme.colors.overlay2.hex,
        } as CSSProperties
      }
    >
      <p className="h-full min-h-[calc(75vh-8rem)] cursor-text py-0.5 pl-0.5 break-all whitespace-pre-wrap select-text selection:bg-(--terminal-selection-bg)/25">
        {entries.map((entry) => {
          return <MemoAnsiHtml key={entry.id} text={entry.message} />;
        })}
      </p>
    </ScrollArea>
  );
};
