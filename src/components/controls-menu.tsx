import {useContext, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {ProfileContext} from "@/components/providers/profile-context.tsx";
import {AttackServiceClient} from "@/generated/com/soulfiremc/grpc/generated/attack.client.ts";
import {convertToProto} from "@/lib/types.ts";
import {AttackStateToggleRequest_State} from "@/generated/com/soulfiremc/grpc/generated/attack.ts";

type State = "unstarted" | "paused" | "running"

export default function ControlsMenu() {
  const [appState, setAppState] = useState<State>("unstarted")
  const transport = useContext(ServerConnectionContext)
  const profile = useContext(ProfileContext)
  const [currentAttack, setCurrentAttack] = useState<number | null>(null)

  const startAttack = async () => {
    const client = new AttackServiceClient(transport)
    const response = await client.startAttack(convertToProto(profile.profile))

    setCurrentAttack(response.response.id)
    setAppState("running")
  }

  const toggleAttackState = async () => {
    const client = new AttackServiceClient(transport)
    if (!currentAttack) {
      return
    }

    await client.toggleAttackState({
      id: currentAttack,
      newState: appState === "paused" ? AttackStateToggleRequest_State.RESUME : AttackStateToggleRequest_State.PAUSE
    })

    setAppState(appState === "paused" ? "running" : "paused")
  }

  const stopAttack = async () => {
    const client = new AttackServiceClient(transport)
    if (!currentAttack) {
      return
    }

    await client.stopAttack({
      id: currentAttack
    })

    setCurrentAttack(null)
    setAppState("unstarted")
  }

  return (
      <div className="grid grid-rows-3 gap-4">
        <Button className="w-full h-full" variant="secondary" onClick={startAttack} disabled={appState !== "unstarted"}>
          Start
        </Button>
        <Button className="w-full h-full" variant="secondary" onClick={toggleAttackState}
                disabled={appState === "unstarted"}>
          {appState === "paused" ? "Resume" : "Pause"}
        </Button>
        <Button className="w-full h-full" variant="secondary" onClick={stopAttack} disabled={appState === "unstarted"}>
          Stop
        </Button>
      </div>
  )
}
