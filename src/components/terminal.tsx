import { useContext, useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { LogsServiceClient } from '@/generated/com/soulfiremc/grpc/generated/logs.client.ts';
import { TransportContext } from './providers/transport-context.tsx';
import { ITerminalOptions, Terminal } from '@xterm/xterm';
import debounce from 'debounce';

const terminalProps: ITerminalOptions = {
  allowTransparency: true,
  fontSize: 12,
  allowProposedApi: true,
};

export const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const serverConnection = useContext(TransportContext);

  useEffect(() => {
    const terminal = new Terminal({ ...terminalProps });

    setTerminal(terminal);
    return () => {
      if (terminal) {
        terminal.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !terminal) {
      return;
    }

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    const resizeListener = debounce(() => {
      if (terminal.element) {
        fitAddon.fit();
      }
    }, 100);

    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, [terminal, terminalRef]);

  useEffect(() => {
    if (!terminalRef.current || !terminal) {
      return;
    }

    terminal.clear();
    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
    logsService
      .subscribe(
        {
          previous: 300,
        },
        {
          abort: abortController.signal,
        },
      )
      .responses.onMessage((message) => {
        for (const line of message.message.split('\n')) {
          terminal.write(line + '\r\n');
        }
      });

    return () => {
      abortController.abort();
    };
  }, [serverConnection, terminal, terminalRef]);

  return <div className="h-full" ref={terminalRef} />;
};
