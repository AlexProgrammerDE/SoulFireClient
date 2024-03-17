import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {ConfigServiceClient} from "@/generated/com/soulfiremc/grpc/generated/ConfigServiceClientPb";
import {ClientDataRequest} from "@/generated/com/soulfiremc/grpc/generated/config_pb";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";

export type ClientInfo = {
    username: string
}

export const ClientInfoContext = createContext<ClientInfo | null>(null)

export const ClientInfoProvider = ({children}: Readonly<{ children: ReactNode }>) => {
    const serverConnection = useContext(ServerConnectionContext)
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)

    useEffect(() => {
        if (serverConnection === null) {
            return
        }

        const configService = new ConfigServiceClient(serverConnection.address);
        const dataRequest = new ClientDataRequest()

        configService.getUIClientData(dataRequest, serverConnection.createMetadata(), (err, response) => {
            if (err) {
                console.error(err)
                return
            }

            setClientInfo({
                username: response.getUsername()
            })
        })
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
