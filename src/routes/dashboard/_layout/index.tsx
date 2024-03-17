import {useContext} from "react";
import {TerminalComponent} from "@/components/terminal.tsx";
import {ClientInfoContext} from "@/components/providers/client-info-provider.tsx";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute('/dashboard/_layout/')({
    component: Dashboard,
})

export default function Dashboard() {
    const clientInfo = useContext(ClientInfoContext)

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <p>
                Hi! :D This is the dashboard. You are connected!
            </p>
            <p>
                Your username is: {clientInfo?.username}
            </p>
            <div className="block">
                <TerminalComponent/>
            </div>
        </div>
    );
}
