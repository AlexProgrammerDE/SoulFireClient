import {useContext, useEffect, useMemo, useRef} from "react";
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
  const terminal = useMemo(() => new Terminal({ ...terminalProps, ...terminalInitOnlyProps }), []);
  const fitAddon = useMemo(() => new FitAddon(), []);
  const serverConnection = useContext(ServerConnectionContext)

  useEffect(() => {
    if (terminalRef.current && !terminal.element) {
      terminal.loadAddon(fitAddon);

      terminal.open(terminalRef.current);
      fitAddon.fit();
    }
  }, [fitAddon, terminal, terminalRef]);

  useEffect(() => {
    const abortController = new AbortController();
    const logsService = new LogsServiceClient(serverConnection);
    logsService.subscribe({
      previous: 300
    }, {
      abort: abortController.signal
    }).responses.onMessage((message) => {
      terminal.write(message.message + "\r\n")
    })

    return () => abortController.abort();
  }, [serverConnection, terminal])

  return (
      <div className="flex-grow" ref={terminalRef}/>
  )
}
