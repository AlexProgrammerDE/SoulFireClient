import {MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger} from "@/components/ui/menubar.tsx";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {toast} from "sonner";
import {listen} from "@tauri-apps/api/event";

type MediaDeviceInfo = {
  id: string
  name: string
  address: string
  port: number
}

export default function CastMenuEntry() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    let listening = true
    const unlistenPromise = listen('cast-device-discovered', (event) => {
      if (!listening) {
        unlistenPromise.then(unlisten => unlisten())
        return
      }

      const payload = event.payload as MediaDeviceInfo
      setDevices(devices => [...devices, payload])
    })

    return () => {
      listening = false
      unlistenPromise.then(unlisten => unlisten())
    }
  }, []);

  return (
      <MenubarMenu>
        <MenubarTrigger>Cast</MenubarTrigger>
        <MenubarContent>
          {
              devices.length > 0 && (
                  <>
                    {
                      devices.map((device, index) => (
                          <MenubarItem key={index} onClick={() => {
                            toast.promise(invoke("connect_cast", {
                              address: device.address,
                              port: device.port
                            }), {
                              loading: `Connecting to ${device.name}...`,
                              success: `Connected to ${device.name}!`,
                              error: `Failed to connect to ${device.name}`
                            })
                          }}>{device.name}</MenubarItem>
                      ))
                    }
                    <MenubarSeparator/>
                  </>
              )
          }
          <MenubarItem onClick={async () => {
            setDevices([])
            toast.promise(invoke("discover_casts"), {
              loading: "Searching for new devices...",
              success: amount => `${amount} device${amount !== "1" ? 's' : ''} found`,
              error: "Failed to find devices"
            })
          }}>Refresh</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
  );
}
