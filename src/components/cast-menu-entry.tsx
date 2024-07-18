import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar.tsx';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { toast } from 'sonner';
import { emit, listen } from '@tauri-apps/api/event';
import { cn } from '@/lib/utils.ts';

type MediaDeviceInfo = {
  id: string;
  full_name: string;
  name: string;
  address: string;
  port: number;
};

type MediaDeviceRemoved = {
  full_name: string;
};

type MediaDeviceDisconnected = {
  transport_id: string;
};

type MediaDeviceState = {
  info: MediaDeviceInfo;
  transport_id: string | null;
};

export default function CastMenuEntry() {
  const [devices, setDevices] = useState<MediaDeviceState[]>([]);

  useEffect(() => {
    let listening = true;
    void listen('cast-device-discovered', (event) => {
      if (!listening) {
        return;
      }

      const payload = event.payload as MediaDeviceInfo;
      setDevices((devices) => [
        ...devices,
        {
          info: payload,
          transport_id: null,
        },
      ]);
    });

    void listen('cast-device-removed', (event) => {
      if (!listening) {
        return;
      }

      const payload = event.payload as MediaDeviceRemoved;
      setDevices((devices) =>
        devices.filter((device) => device.info.full_name !== payload.full_name),
      );
    });

    void listen('cast-device-disconnected', (event) => {
      if (!listening) {
        return;
      }

      const payload = event.payload as MediaDeviceDisconnected;
      setDevices((devices) =>
        devices.map((device) => {
          if (device.transport_id === payload.transport_id) {
            toast(`Disconnected from ${device.info.name}`);
            return {
              ...device,
              transport_id: null,
            };
          }

          return device;
        }),
      );
    });

    return () => {
      listening = false;
    };
  }, []);

  useEffect(() => {
    void invoke('discover_casts');
  }, []);

  return (
    <MenubarMenu>
      <MenubarTrigger>Cast</MenubarTrigger>
      <MenubarContent>
        {devices.length > 0 ? (
          devices.map((currentDevice) => (
            <MenubarItem
              key={currentDevice.info.id}
              className={cn({
                'text-green-500': currentDevice.transport_id !== null,
                'text-red-500': currentDevice.transport_id === null,
              })}
              onClick={() => {
                if (currentDevice.transport_id !== null) {
                  toast(`Already connected to ${currentDevice.info.name}`);
                  return;
                }

                toast.promise(
                  invoke('connect_cast', {
                    address: currentDevice.info.address,
                    port: currentDevice.info.port,
                  }),
                  {
                    loading: `Connecting to ${currentDevice.info.name}...`,
                    success: (transportId) => {
                      console.log(transportId);
                      setDevices((devices) =>
                        devices.map((device) => {
                          if (
                            device.info.full_name ===
                            currentDevice.info.full_name
                          ) {
                            return {
                              ...device,
                              transport_id: transportId as string,
                            };
                          }

                          return device;
                        }),
                      );

                      return `Connected to ${currentDevice.info.name}!`;
                    },
                    error: `Failed to connect to ${currentDevice.info.name}`,
                  },
                );
              }}
            >
              <p>{currentDevice.info.name}</p>
            </MenubarItem>
          ))
        ) : (
          <MenubarItem
            disabled
            onClick={() => {
              toast('No devices found');
            }}
          >
            No devices found
          </MenubarItem>
        )}
        <MenubarSeparator />
        <MenubarItem
          onClick={() => {
            void toast.promise(
              emit('cast-global-message', {
                type: 'DISPLAY_LOGS',
                logs: ['Hello from SoulFire!'],
              }),
              {
                loading: 'Broadcasting message...',
                success: 'Message broadcasted!',
                error: 'Failed to broadcast message',
              },
            );
          }}
        >
          Broadcast test
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
