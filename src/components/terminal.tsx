import {useContext, useEffect} from "react";
import "xterm/css/xterm.css";
import {Terminal} from "xterm";
import {FitAddon} from '@xterm/addon-fit';
import {LogsServiceClient} from "@/generated/com/soulfiremc/grpc/generated/logs.client.ts";
import {ServerConnectionContext} from "./providers/server-context";

let terminal: Terminal;
export const TerminalComponent = () => {
  const serverConnection = useContext(ServerConnectionContext)

  useEffect(() => {
    terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(document.getElementById("terminal")!);
    terminal.focus();
    fitAddon.fit();

    window.addEventListener('resize', () => fitAddon.fit());
  }, [])

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
  }, [serverConnection])

  return (
      <div id="terminal"/>
  )
}
