import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {createFileRoute, Outlet, redirect, useNavigate} from "@tanstack/react-router";
import {GrpcWebFetchTransport} from "@protobuf-ts/grpcweb-transport";
import {ConfigServiceClient} from "@/generated/com/soulfiremc/grpc/generated/config.client.ts";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {DashboardMenuHeader} from "@/components/dashboard-menu-header.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {TerminalComponent} from "@/components/terminal.tsx";
import CommandInput from "@/components/command-input.tsx";
import ProfileProvider from "@/components/providers/profile-context.tsx";
import {LOCAL_STORAGE_SERVER_ADDRESS_KEY, LOCAL_STORAGE_SERVER_TOKEN_KEY} from "@/lib/types.ts";
import {isTauri} from "@/lib/utils.ts";
import {createDir, readDir} from "@tauri-apps/api/fs";
import {appConfigDir, resolve} from "@tauri-apps/api/path";

const isAuthenticated = () => {
  return localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY) !== null && localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY) !== null
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
    const address = localStorage.getItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY)
    const token = localStorage.getItem(LOCAL_STORAGE_SERVER_TOKEN_KEY)

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

    let availableProfiles: string[] = []
    if (isTauri()) {
      const profileDir = await resolve(await resolve(await appConfigDir(), 'profile'))
      await createDir(profileDir, {recursive: true})

      availableProfiles = (await readDir(profileDir))
          .filter(file => !file.children)
          .filter(file => file.name)
          .map(file => file.name!)
          .filter(file => file.endsWith('.json'))
    }

    return {
      transport,
      clientData: result.response,
      availableProfiles
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

function ErrorComponent({error}: { error: Error }) {
  const navigate = useNavigate()

  return (
      <div className="m-auto flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-red-500">
          {error.message}
        </p>
        <Button className="w-fit" onClick={() => {
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
  const {transport, clientData, availableProfiles} = Route.useLoaderData()
  const [sentInitial, setSentInitial] = useState(false)

  useEffect(() => {
    if (sentInitial) {
      return
    }

    toast.warning("Experimental Software!", {
      description: "The SoulFire client is currently in development and is not ready for production use."
    })

    setSentInitial(true)
  }, [sentInitial]);

  return (
      <div className="flex flex-col h-screen w-screen">
        <ServerConnectionContext.Provider value={transport}>
          <ClientInfoContext.Provider value={clientData}>
            <ProfileProvider>
              <DashboardMenuHeader availableProfiles={availableProfiles}/>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex p-4">
                  <Outlet/>
                </div>
                <div className="flex flex-col gap-4 p-4">
                  <TerminalComponent/>
                  <CommandInput/>
                </div>
              </div>
            </ProfileProvider>
          </ClientInfoContext.Provider>
        </ServerConnectionContext.Provider>
      </div>
  );
}
