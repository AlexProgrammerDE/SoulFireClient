import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {createFileRoute, Outlet, redirect} from "@tanstack/react-router";
import {LogsProvider} from "@/components/providers/logs-provider";
import {ClientInfoProvider} from "@/components/providers/client-info-provider";
import {GrpcWebFetchTransport} from "@protobuf-ts/grpcweb-transport";
import {RpcTransport} from "@protobuf-ts/runtime-rpc";

const isAuthenticated = () => {
    return localStorage.getItem("server-address") !== null && localStorage.getItem("server-token") !== null
}

let transport: RpcTransport
export const Route = createFileRoute('/dashboard/_layout')({
    beforeLoad: async ({location}) => {
        if (!isAuthenticated()) {
            throw redirect({
                to: '/',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    loader: () => {
        const address = localStorage.getItem("server-address")
        const token = localStorage.getItem("server-token")

        if (!address || !token) {
            throw new Error("No server address or token")
        }

        transport = new GrpcWebFetchTransport({
            baseUrl: address,
            meta: {
                Authorization: `Bearer ${token}`
            }
        });
    },
    component: ClientLayout,
})

function ClientLayout() {
    console.log("ClientLayout")
    return (
        <div className="container">
            <ServerConnectionContext.Provider value={transport}>
                <LogsProvider>
                    <ClientInfoProvider>
                        <Outlet/>
                    </ClientInfoProvider>
                </LogsProvider>
            </ServerConnectionContext.Provider>
        </div>
    );
}
