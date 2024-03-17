import {ReactNode, useEffect, useState} from "react";
import grpcWeb from "grpc-web";
import {ServerConnectionContext, ServerConnectionInfo} from "@/components/providers/server-context.tsx";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {LogsProvider} from "@/components/providers/logs-provider";
import { ClientInfoProvider } from "@/components/providers/client-info-provider";

export const Route = createFileRoute('/dashboard/_layout')({
    component: ClientLayout,
})

function ClientLayout({
                                         children,
                                     }: Readonly<{
    children: ReactNode;
}>) {
    const router = useNavigate()
    const [serverConnection, setServerConnection] = useState<ServerConnectionInfo | null>(null)

    useEffect(() => {
        if (serverConnection !== null) {
            return
        }

        const address = localStorage.getItem("server-address")
        const token = localStorage.getItem("server-token")

        if (address && token) {
            const serverConnection: ServerConnectionInfo = {
                address,
                token,
                createMetadata: (): grpcWeb.Metadata => {
                    return {
                        Authorization: `Bearer ${token}`
                    }
                }
            }

            setServerConnection(serverConnection)
        } else {
            router({to: "/"}).then()
        }
    }, [router, serverConnection])

    if (!serverConnection) {
        return (
            <div className="w-full h-full flex">
                Connecting...
            </div>
        );
    }

    return (
        <ServerConnectionContext.Provider value={serverConnection}>
            <LogsProvider>
                <ClientInfoProvider>
                    {children}
                </ClientInfoProvider>
            </LogsProvider>
        </ServerConnectionContext.Provider>
    );
}
