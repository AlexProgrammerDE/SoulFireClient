import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {LogsServiceClient} from "@/generated/com/soulfiremc/grpc/generated/logs.client.ts";

export const LogsContext = createContext<{
    value: string[]
    setValue: (value: string[]) => void
}>({
    value: [],
    setValue: () => {
    }
})

export const LogsProvider = ({children}: Readonly<{ children: ReactNode }>) => {
    const serverConnection = useContext(ServerConnectionContext)
    const [logs, setLogs] = useState<string[]>([])

    useEffect(() => {
        const abortController = new AbortController();
        const logsService = new LogsServiceClient(serverConnection);
        logsService.subscribe({
            previous: 300
        }, {
            abort: abortController.signal
        }).responses.onMessage((message) => {
            setLogs((logs) => [...logs, message.message + "\r\n"])
        })

        return () => abortController.abort();
    }, [serverConnection])

    return (
        <LogsContext.Provider value={{value: logs, setValue: setLogs}}>
            {children}
        </LogsContext.Provider>
    )
}
