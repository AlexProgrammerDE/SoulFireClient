import {useCallback, useContext, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {ProfileContext} from "@/components/providers/profile-context.tsx";
import {AttackServiceClient} from "@/generated/com/soulfiremc/grpc/generated/attack.client.ts";
import {convertToProto} from "@/lib/types.ts";
import {AttackStateToggleRequest_State} from "@/generated/com/soulfiremc/grpc/generated/attack.ts";
import {toast} from "sonner";

type State = "unstarted" | "paused" | "running"

export default function ControlsMenu() {
  const [appState, setAppState] = useState<State>("unstarted")
  const transport = useContext(ServerConnectionContext)
  const profile = useContext(ProfileContext)
  const [currentAttack, setCurrentAttack] = useState<number | null>(null)

  const startAttack = useCallback(() => {
    const client = new AttackServiceClient(transport)
    toast.promise(client.startAttack(convertToProto(profile.profile)).then(r => {
      setCurrentAttack(r.response.id)
      setAppState("running")

      return r
    }), {
      loading: "Starting attack...",
      success: r => `Attack ${r.response.id} started successfully`,
      error: (e) => {
        console.error(e)
        return 'Failed to start attack'
      }
    })
  }, [profile, transport])

  const toggleAttackState = useCallback(() => {
    const client = new AttackServiceClient(transport)
    if (!currentAttack) {
      return
    }

    toast.promise(client.toggleAttackState({
      id: currentAttack,
      newState: appState === "paused" ? AttackStateToggleRequest_State.RESUME : AttackStateToggleRequest_State.PAUSE
    }).then(() => {
      setAppState(appState === "paused" ? "running" : "paused")
    }), {
      loading: "Toggling attack state...",
      success: `Attack state toggled to ${appState === "paused" ? "running" : "paused"}`,
      error: (e) => {
        console.error(e)
        return 'Failed to toggle attack state'
      }
    })
  }, [appState, currentAttack, transport])

  const stopAttack = useCallback(() => {
    const client = new AttackServiceClient(transport)
    if (!currentAttack) {
      return
    }

    toast.promise(client.stopAttack({
      id: currentAttack
    }).then(() => {
      setCurrentAttack(null)
      setAppState("unstarted")
    }), {
      loading: "Stopping attack...",
      success: `Attack ${currentAttack} stopped successfully`,
      error: (e) => {
        console.error(e)
        return 'Failed to stop attack'
      }
    })
  }, [currentAttack, transport])

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
