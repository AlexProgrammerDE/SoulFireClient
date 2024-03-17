import {useContext} from "react";
import {TerminalComponent} from "@/components/terminal.tsx";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {createFileRoute} from "@tanstack/react-router";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {AlertCircle, MessageSquareWarningIcon, TriangleAlert} from "lucide-react";
import {Warning} from "postcss";

export const Route = createFileRoute('/dashboard/_layout/')({
    component: Dashboard,
})

export default function Dashboard() {
    const clientInfo = useContext(ClientInfoContext)

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <Alert variant="default" className="mb-4">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Experimental Software!</AlertTitle>
                <AlertDescription>
                    The SoulFire client is currently in development and is not ready for production use.
                </AlertDescription>
            </Alert>
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
