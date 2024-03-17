import {useContext, useEffect} from "react";
import {LogsContext} from "@/components/providers/logs-provider.tsx";
import "xterm/css/xterm.css";
import {Terminal} from "xterm";

let terminal: Terminal;
export const TerminalComponent = () => {
    console.log("TerminalComponent")
    const logs = useContext(LogsContext)

    useEffect(() => {
        if (terminal !== undefined) {
            if (logs.value.length === 0) {
                return
            }

            terminal.write(logs.value.join(""))
            logs.setValue([])
            logs.value = []
            return
        }

        terminal = new Terminal();
        terminal.open(document.getElementById("terminal")!);
        terminal.write(logs.value.join(""))

        logs.setValue([])
        logs.value = []
    }, [logs])

    return (
        <div id="terminal"/>
    )
}
