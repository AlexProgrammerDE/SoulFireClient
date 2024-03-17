"use client";

import {useContext, useEffect, useRef} from "react";
import {XTerm} from "xterm-for-react";
import Xterm from "xterm-for-react/dist/src/XTerm";
import {LogsContext} from "@/components/providers/logs-provider.tsx";

export const Terminal = () => {
    const xtermRef = useRef<Xterm | null>(null)
    const logs = useContext(LogsContext)

    useEffect(() => {
        if (xtermRef.current === null) {
            return
        }

        console.log(logs)
        xtermRef.current.terminal.write(logs)

        const eventListener = (event: any) => {
            xtermRef.current?.terminal.writeln(event.detail.line)
        }

        document.addEventListener("sf-logs", eventListener)

        return () => document.removeEventListener("sf-logs", eventListener)
    }, [logs])

    return (
        <XTerm ref={xtermRef} options={{}}/>
    )
}
