import { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { LogsServiceClient } from '@/generated/soulfire/logs.client.ts';
import { TransportContext } from './providers/transport-context.tsx';
import { ScrollArea } from './ui/scroll-area.tsx';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import { flavorEntries } from '@catppuccin/palette';
import { AnsiHtml } from 'fancy-ansi/react';
import { isDemo } from '@/lib/utils.ts';

const hslToString = (rgb: { h: number; s: number; l: number }): string => {
  return `${Math.round(rgb.h)}, ${Math.round(rgb.s * 100)}%, ${Math.round(rgb.l * 100)}%`;
};

const MAX_TERMINAL_ENTRIES = 500;

export const TerminalComponent = () => {
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<(readonly [string, string])[]>(
    isDemo()
      ? [
          ['entry1', 'Welcome to demo mode! 🧪'],
          ['entry2', 'This is a read-only instance of SoulFire'],
          [
            'entry3',
            'Check out all the menus and features before deciding to install SoulFire :D',
          ],
          [
            'entry4',
            'Feel free to join our Discord server if you would like to reach out: https://soulfiremc.com/discord',
          ],
        ]
      : [],
  );
  const transport = useContext(TransportContext);
  const terminalTheme = useContext(TerminalThemeContext);
  const paneRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const selectedTheme = flavorEntries.find(
    (entry) => entry[0] === terminalTheme.value,
  )![1];

  const handleScroll = () => {
    if (paneRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = paneRef.current;
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    }
  };

  useEffect(() => {
    const pane = paneRef.current;
    if (pane) {
      pane.addEventListener('scroll', handleScroll);
      return () => {
        pane.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    if (isAtBottom && paneRef.current) {
      paneRef.current.scrollTop = paneRef.current.scrollHeight;
    }
  }, [entries, isAtBottom]);

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
          // Max allowed amount of entries by the server
          count: 300,
        },
        {
          abort: abortController.signal,
        },
      )
      .then((response) => {
        for (const line of response.response.messages) {
          const randomString = Math.random().toString(36).substring(7);
          setEntries((prev) => [...prev, [randomString, line] as const]);
        }
        setGotPrevious(true);
      });

    return () => {
      abortController.abort();
    };
  }, [gotPrevious, transport]);

  useEffect(() => {
    if (transport === null) {
      return;
    }

    const abortController = new AbortController();
    const logsService = new LogsServiceClient(transport);
    logsService
      .subscribe(
        {},
        {
          abort: abortController.signal,
        },
      )
      .responses.onMessage((message) => {
        for (const line of message.message.split('\n')) {
          const randomString = Math.random().toString(36).substring(7);
          setEntries((prev) => {
            const resultingArray = [...prev, [randomString, line] as const];

            return resultingArray.slice(-MAX_TERMINAL_ENTRIES);
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [transport]);

  return (
    <ScrollArea
      viewportRef={paneRef}
      className="h-[calc(75vh-8rem)] pr-4 font-mono rounded-md text-xs"
      style={
        {
          backgroundColor: selectedTheme.colors.base.hex,
          color: selectedTheme.colors.text.hex,
          '--border': hslToString(selectedTheme.colors.surface0.hsl),
          '--ansi-black': selectedTheme.dark
            ? selectedTheme.colors.surface1.hex
            : selectedTheme.colors.subtext1.hex,
          '--ansi-red': selectedTheme.colors.red.hex,
          '--ansi-green': selectedTheme.colors.green.hex,
          '--ansi-yellow': selectedTheme.colors.yellow.hex,
          '--ansi-blue': selectedTheme.colors.blue.hex,
          '--ansi-magenta': selectedTheme.colors.pink.hex,
          '--ansi-cyan': selectedTheme.colors.teal.hex,
          '--ansi-white': selectedTheme.colors.text.hex,
          '--ansi-bright-black': selectedTheme.dark
            ? selectedTheme.colors.surface2.hex
            : selectedTheme.colors.subtext0.hex,
          '--ansi-bright-red': selectedTheme.colors.red.hex,
          '--ansi-bright-green': selectedTheme.colors.green.hex,
          '--ansi-bright-yellow': selectedTheme.colors.yellow.hex,
          '--ansi-bright-blue': selectedTheme.colors.blue.hex,
          '--ansi-bright-magenta': selectedTheme.colors.pink.hex,
          '--ansi-bright-cyan': selectedTheme.colors.teal.hex,
          '--ansi-bright-white': selectedTheme.colors.text.hex,
        } as CSSProperties
      }
    >
      <div className="whitespace-pre-wrap py-0.5 pl-0.5 h-full">
        {entries.map((entry) => {
          return (
            <div key={entry[0]}>
              <AnsiHtml text={entry[1]} />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
