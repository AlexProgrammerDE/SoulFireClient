import {useContext} from "react";
import {Terminal} from "@/components/terminal.tsx";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {ClientInfoContext} from "@/components/providers/client-info-provider.tsx";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute('/dashboard/_layout/')({
    component: Dashboard,
})

export default function Dashboard() {
    const serverConnection = useContext(ServerConnectionContext)
    const clientInfo = useContext(ClientInfoContext)

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <p>
                Hi! :D This is the dashboard. You are connected to {serverConnection?.address}.
            </p>
            <p>
                Your username is: {clientInfo?.username}
            </p>
            <Terminal/>
        </div>
    );
}
