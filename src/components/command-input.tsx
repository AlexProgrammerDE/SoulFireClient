import {Input} from "@/components/ui/input.tsx";
import {KeyboardEventHandler, useContext} from "react";
import {ServerConnectionContext} from "@/components/providers/server-context.tsx";
import {CommandServiceClient} from "@/generated/com/soulfiremc/grpc/generated/command.client.ts";

export default function CommandInput() {
  const transport = useContext(ServerConnectionContext)

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      const commandService = new CommandServiceClient(transport);
      void commandService.executeCommand({
        command: e.currentTarget.value
      })
    }
  }

  return <Input placeholder="Enter command" onKeyDown={handleKeyDown}/>
}
