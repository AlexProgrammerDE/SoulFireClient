import { useContext, useEffect, useState } from 'react';
import { LogsServiceClient } from '@/generated/com/soulfiremc/grpc/generated/logs.client.ts';
import { TransportContext } from './providers/transport-context.tsx';
import { type AnsiColored, parse } from 'ansicolor';
import { ScrollArea } from './ui/scroll-area.tsx';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
      STYLE?: string;
    }
  }
}

export const TerminalComponent = () => {
  const [gotPrevious, setGotPrevious] = useState(false);
  const [entries, setEntries] = useState<[string, AnsiColored][]>([]);
  const serverConnection = useContext(TransportContext);

  useEffect(() => {
    if (gotPrevious) {
      return;
    }

    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
    void logsService
      .getPrevious(
        {
          count: 300,
        },
        {
          abort: abortController.signal,
        },
      )
      .then((response) => {
        for (const line of response.response.messages) {
          const randomString = Math.random().toString(36).substring(7);
          setEntries((prev) => [...prev, [randomString, parse(line)] as const]);
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
          setEntries((prev) => [...prev, [randomString, parse(line)] as const]);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [serverConnection]);

  return (
    <ScrollArea className="h-full w-full pr-4">
      <div className="whitespace-pre">
        {entries.map((entry) => {
          return (
            <div key={entry[0]}>
              {entry[1].spans.map((span, index) => {
                return (
                  <span STYLE={span.css} key={index}>
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
