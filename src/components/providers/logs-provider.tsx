import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {LogsServiceClient} from "@/generated/com/soulfiremc/grpc/generated/LogsServiceClientPb";
import {LogRequest} from "@/generated/com/soulfiremc/grpc/generated/logs_pb";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";

export const LogsContext = createContext<string>("")

export const LogsProvider = ({children}: Readonly<{ children: ReactNode }>) => {
    const serverConnection = useContext(ServerConnectionContext)
    const [logs, setLogs] = useState<string | null>(null)

    useEffect(() => {
        if (serverConnection === null || logs !== null) {
            return
        }

        // To avoid multiple subscriptions
        setLogs("")

        let appendableLogs = ""
        const logsService = new LogsServiceClient(serverConnection.address);
        const logRequest = new LogRequest()
        logRequest.setPrevious(300)
        logsService.subscribe(logRequest, serverConnection.createMetadata()).on("data", (response) => {
            appendableLogs += response.getMessage() + "\n"
            setLogs(appendableLogs)
            document.dispatchEvent(new CustomEvent("sf-logs", {detail: {line: response.getMessage()}}))
        })
    }, [logs, serverConnection])

    if (serverConnection === null) {
        return (
            <div className="w-full h-full flex">
                Loading...
            </div>
        );
    }

    return (
        <LogsContext.Provider value={logs ?? ""}>
            {children}
        </LogsContext.Provider>
    )
}
