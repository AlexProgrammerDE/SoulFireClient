import {useContext, useEffect, useRef, useState} from "react";
import "xterm/css/xterm.css";
import {FitAddon} from '@xterm/addon-fit';
import {LogsServiceClient} from "@/generated/com/soulfiremc/grpc/generated/logs.client.ts";
import {ServerConnectionContext} from "./providers/server-context";
import {ITerminalInitOnlyOptions, ITerminalOptions, Terminal} from "@xterm/xterm";

const terminalProps: ITerminalOptions = {
  allowTransparency: true,
  fontSize: 12,
  allowProposedApi: true,
};

const terminalInitOnlyProps: ITerminalInitOnlyOptions = {
  rows: 30,
};

export const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const serverConnection = useContext(ServerConnectionContext)

  useEffect(() => {
    const terminal = new Terminal({...terminalProps, ...terminalInitOnlyProps});

    setTerminal(terminal);
    return () => {
      if (terminal) {
        terminal.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !terminal) {
      return
    }

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();
  }, [terminal, terminalRef]);

  useEffect(() => {
    if (!terminalRef.current || !terminal) {
      return
    }

    terminal.clear();
    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
    logsService.subscribe({
      previous: 300
    }, {
      abort: abortController.signal
    }).responses.onMessage((message) => {
      for (const line of message.message.split("\n")) {
        terminal.write(line + "\r\n")
      }
    })

    return () => {
      abortController.abort();
    }
  }, [serverConnection, terminal, terminalRef]);

  return (
      <div className="flex-grow" ref={terminalRef}/>
  )
}
