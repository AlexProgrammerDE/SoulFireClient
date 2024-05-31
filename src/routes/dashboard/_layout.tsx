import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {createFileRoute, Outlet, redirect, useNavigate} from "@tanstack/react-router";
import {LogsProvider} from "@/components/providers/logs-provider";
import {GrpcWebFetchTransport} from "@protobuf-ts/grpcweb-transport";
import {ConfigServiceClient} from "@/generated/com/soulfiremc/grpc/generated/config.client.ts";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {DashboardMenuHeader} from "@/components/dashboard-menu-header.tsx";
import {ProfileContext} from "@/components/providers/profile-context";
import {DEFAULT_PROFILE} from "@/lib/types.ts";
import {Button} from "@/components/ui/button.tsx";

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
        const result = await configService.getClientData({}, {
            abort: props.abortController.signal
        })

        return {
            transport,
            clientData: result.response
        }
    },
    errorComponent: ErrorComponent,
    pendingComponent: () => (
        <div className="w-full h-full flex">
            Connecting...
        </div>
    ),
    component: ClientLayout,
})

function ErrorComponent({error}: {error: Error}) {
    const navigate = useNavigate()

    return (
        <div className="m-auto flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-red-500">
                {error.message}
            </p>
            <Button className="w-fit" onClick={() => {
                localStorage.removeItem("server-address")
                localStorage.removeItem("server-token")

                void navigate({
                    to: "/",
                    replace: true
                })
            }}>
                Back to login
            </Button>
        </div>
    )
}

function ClientLayout() {
    const {transport, clientData} = Route.useLoaderData()
    return (
        <div className="min-h-screen w-screen container">
            <ServerConnectionContext.Provider value={transport}>
                <ClientInfoContext.Provider value={clientData}>
                    <LogsProvider>
                        <ProfileContext.Provider value={DEFAULT_PROFILE}>
                            <DashboardMenuHeader/>
                            <Outlet/>
                        </ProfileContext.Provider>
                    </LogsProvider>
                </ClientInfoContext.Provider>
            </ServerConnectionContext.Provider>
        </div>
    );
}
