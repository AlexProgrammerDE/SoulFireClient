import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {createFileRoute, Outlet, redirect} from "@tanstack/react-router";
import {LogsProvider} from "@/components/providers/logs-provider";
import {GrpcWebFetchTransport} from "@protobuf-ts/grpcweb-transport";
import {ConfigServiceClient} from "@/generated/com/soulfiremc/grpc/generated/config.client.ts";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";

const isAuthenticated = () => {
    return localStorage.getItem("server-address") !== null && localStorage.getItem("server-token") !== null
}

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
    loader: async props => {
        const address = localStorage.getItem("server-address")
        const token = localStorage.getItem("server-token")

        if (!address || !token) {
            throw new Error("No server address or token")
        }

        const transport = new GrpcWebFetchTransport({
            baseUrl: address,
            meta: {
                Authorization: `Bearer ${token}`
            }
        });

        const configService = new ConfigServiceClient(transport);
        const result = await configService.getUIClientData({}, {
            abort: props.abortController.signal
        })

        return {
            transport,
            clientData: result.response
        }
    },
    pendingComponent: () => (
        <div className="w-full h-full flex">
            Loading...
        </div>
    ),
    component: ClientLayout,
})

function ClientLayout() {
    const {transport, clientData} = Route.useLoaderData()

    return (
        <div className="container">
            <ServerConnectionContext.Provider value={transport}>
                <ClientInfoContext.Provider value={clientData}>
                <LogsProvider>
                    <Outlet/>
                </LogsProvider>
                </ClientInfoContext.Provider>
            </ServerConnectionContext.Provider>
        </div>
    );
}
