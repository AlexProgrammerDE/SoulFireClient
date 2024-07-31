import { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { LogsServiceClient } from '@/generated/com/soulfiremc/grpc/generated/logs.client.ts';
import { TransportContext } from './providers/transport-context.tsx';
import { ansicolor, parse } from 'ansicolor';
import { ScrollArea } from './ui/scroll-area.tsx';
import { TerminalThemeContext } from '@/components/providers/terminal-theme-context.tsx';
import { flavorEntries } from '@catppuccin/palette';

const rgbToArray = (rgb: {
  r: number;
  g: number;
  b: number;
}): [number, number, number] => {
  return [rgb.r, rgb.g, rgb.b];
};

const hslToString = (rgb: { h: number; s: number; l: number }): string => {
  return `${Math.round(rgb.h)}, ${Math.round(rgb.s * 100)}%, ${Math.round(rgb.l * 100)}%`;
};

function cssToStyles(css: string) {
  return css
    .split(';')
    .map((cur) => cur.split(':'))
    .reduce((acc: Record<string, string>, [key, value]) => {
      key = key.replace(/-./g, (css) => css.toUpperCase()[1]);
      acc[key] = value;
      return acc;
    }, {});
}

export const TerminalComponent = () => {
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<(readonly [string, string])[]>([]);
  const serverConnection = useContext(TransportContext);
  const terminalTheme = useContext(TerminalThemeContext);
  const paneRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const selectedTheme = flavorEntries.find(
    (entry) => entry[0] === terminalTheme.value,
  )![1];
  ansicolor.rgb = {
    black: [0, 0, 0],
    darkGray: rgbToArray(
      selectedTheme.dark
        ? selectedTheme.colors.surface1.rgb
        : selectedTheme.colors.subtext1.rgb,
    ),
    lightGray: rgbToArray(
      selectedTheme.dark
        ? selectedTheme.colors.surface2.rgb
        : selectedTheme.colors.subtext0.rgb,
    ),
    white: rgbToArray(selectedTheme.colors.text.rgb),

    red: rgbToArray(selectedTheme.colors.red.rgb),
    lightRed: rgbToArray(selectedTheme.colors.red.rgb),

    green: rgbToArray(selectedTheme.colors.green.rgb),
    lightGreen: rgbToArray(selectedTheme.colors.green.rgb),

    yellow: rgbToArray(selectedTheme.colors.yellow.rgb),
    lightYellow: rgbToArray(selectedTheme.colors.yellow.rgb),

    blue: rgbToArray(selectedTheme.colors.blue.rgb),
    lightBlue: rgbToArray(selectedTheme.colors.blue.rgb),

    magenta: rgbToArray(selectedTheme.colors.pink.rgb),
    lightMagenta: rgbToArray(selectedTheme.colors.pink.rgb),

    cyan: rgbToArray(selectedTheme.colors.teal.rgb),
    lightCyan: rgbToArray(selectedTheme.colors.teal.rgb),
  };

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

    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
    void logsService
      .getPrevious(
        {
          count: 500,
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
  }, [gotPrevious, serverConnection]);

  useEffect(() => {
    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
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
            let resultingArray = [...prev, [randomString, line] as const];

            if (resultingArray.length > 500) {
              resultingArray = resultingArray.slice(
                resultingArray.length - 500,
              );
            }

            return resultingArray;
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [serverConnection]);

  return (
    <ScrollArea
      viewportRef={paneRef}
      className="md:h-[calc(100vh-8rem)] w-full pr-4 font-mono rounded-md text-sm"
      style={
        {
          backgroundColor: selectedTheme.colors.base.hex,
          '--border': hslToString(selectedTheme.colors.surface0.hsl),
        } as CSSProperties
      }
    >
      <div className="whitespace-pre-wrap pl-1 h-full">
        {entries.map((entry) => {
          return (
            <div key={entry[0]}>
              {parse(entry[1]).spans.map((span, index) => {
                return (
                  <span
                    style={cssToStyles(
                      span.css === ''
                        ? `color: hsl(${hslToString(selectedTheme.colors.text.hsl)})`
                        : span.css,
                    )}
                    key={index}
                  >
                    {span.text}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
