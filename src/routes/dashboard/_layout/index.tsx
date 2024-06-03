import {useContext} from "react";
import {ClientInfoContext} from "@/components/providers/client-info-context.tsx";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute('/dashboard/_layout/')({
  component: Dashboard,
})

export default function Dashboard() {
  const clientInfo = useContext(ClientInfoContext)

  return (
      <div className="w-full h-full flex flex-col space-y-4">
        <p>
          Hi! :D This is the dashboard. You are connected, {clientInfo?.username}!
        </p>
      </div>
  );
}
