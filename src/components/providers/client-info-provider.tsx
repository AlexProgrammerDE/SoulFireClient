import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {ConfigServiceClient} from "@/generated/com/soulfiremc/grpc/generated/config.client.ts";

export type ClientInfo = {
    username: string
}

export const ClientInfoContext = createContext<ClientInfo | null>(null)

export const ClientInfoProvider = ({children}: Readonly<{ children: ReactNode }>) => {
    console.log("ClientInfoProvider")
    const serverConnection = useContext(ServerConnectionContext)
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)

    useEffect(() => {
        console.log("Client info requested")

        const abortController = new AbortController();
        const configService = new ConfigServiceClient(serverConnection);
        configService.getUIClientData({}, {
            abort: abortController.signal
        }).then(result =>
            setClientInfo({
                username: result.response.username
            }), reason => {
            console.error(reason)
        })

        return () => {
            console.log("Client info request aborted")
            abortController.abort()
        };
    }, [serverConnection])

    if (clientInfo === null) {
        return (
            <div className="w-full h-full flex">
                Preparing interface...
            </div>
        );
    }

    return (
        <ClientInfoContext.Provider value={clientInfo}>
            {children}
        </ClientInfoContext.Provider>
    )
}
