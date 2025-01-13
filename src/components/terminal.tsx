import React, {
  CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LogsServiceClient } from '@/generated/soulfire/logs.client.ts';
import { TransportContext } from './providers/transport-context.tsx';
import { ScrollArea } from './ui/scroll-area.tsx';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import { flavorEntries } from '@catppuccin/palette';
import { AnsiHtml } from 'fancy-ansi/react';
import { isDemo } from '@/lib/utils.ts';
import { LogRequest, PreviousLogRequest } from '@/generated/soulfire/logs.ts';
import { stripAnsi } from 'fancy-ansi';

const hslToString = (rgb: { h: number; s: number; l: number }): string => {
  return `${Math.round(rgb.h)}, ${Math.round(rgb.s * 100)}%, ${Math.round(rgb.l * 100)}%`;
};

const MAX_TERMINAL_ENTRIES = 500;

const MemoAnsiHtml = React.memo((props: { text: string }) => {
  return (
    <AnsiHtml
      text={
        stripAnsi(props.text).endsWith('\n') ? props.text : props.text + '\n'
      }
    />
  );
});

export const TerminalComponent = (props: {
  scope: PreviousLogRequest['scope'] | LogRequest['scope'];
}) => {
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<
    {
      id: string;
      message: string;
    }[]
  >(
    isDemo()
      ? [
          { id: 'demo-1', message: 'Welcome to demo mode! 🧪' },
          { id: 'demo-2', message: 'This is a read-only instance of SoulFire' },
          {
            id: 'demo-3',
            message:
              'Check out all the menus and features before deciding to install SoulFire :D',
          },
          {
            id: 'demo-4',
            message:
              'Feel free to join our Discord server if you would like to reach out: https://soulfiremc.com/discord',
          },
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
            {
              id: 'empty',
              message:
                '🧙 Looks like there are no logs to display; try running some commands!',
            },
          ]);
        }

        for (const message of call.response.messages) {
          setEntries((prev) => [...prev, message]);
        }
        setGotPrevious(true);
      });

    return () => {
      abortController.abort();
    };
  }, [gotPrevious, props.scope, transport]);

  useEffect(() => {
    if (transport === null) {
      return;
    }

    const abortController = new AbortController();
    const logsService = new LogsServiceClient(transport);
    logsService
      .subscribe(
        {
          scope: props.scope,
        },
        {
          abort: abortController.signal,
        },
      )
      .responses.onMessage((response) => {
        const message = response.message;
        if (message === undefined) {
          return;
        }

        setEntries((prev) => {
          const resultingArray = [
            ...prev.filter((entry) => entry.id !== 'empty'),
            message,
          ];

          return resultingArray.slice(-MAX_TERMINAL_ENTRIES);
        });
      });

    return () => {
      abortController.abort();
    };
  }, [props.scope, transport]);

  console.log('entries', entries);
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
      <p className="whitespace-pre-wrap break-words py-0.5 pl-0.5 h-full select-text cursor-text">
        {entries.map((entry) => {
          return <MemoAnsiHtml key={entry.id} text={entry.message} />;
        })}
      </p>
    </ScrollArea>
  );
};
