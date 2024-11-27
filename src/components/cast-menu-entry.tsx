import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar.tsx';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { emit, listen } from '@tauri-apps/api/event';
import { cn, cancellablePromiseDefault } from '@/lib/utils.ts';
import { CastIcon, RadioTowerIcon } from 'lucide-react';

type MediaDeviceInfo = {
  id: string;
  full_name: string;
  name: string;
  address: string;
  port: number;
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
    const interval = setInterval(() => {
      void invoke('get_casts').then((result) => {
        const devices = result as MediaDeviceInfo[];
        setDevices((oldDevices) => {
          return devices.map((device) => {
            const oldDevice = oldDevices.find((d) => d.info.id === device.id);
            return {
              info: device,
              transport_id: oldDevice?.transport_id ?? null,
            };
          });
        });
      });
    }, 1_000);

    const cancel = cancellablePromiseDefault(
      listen('cast-device-disconnected', (event) => {
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
      }),
    );

    return () => {
      clearInterval(interval);
      cancel();
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
                    error: (e) => {
                      console.error(e);
                      return `Failed to connect to ${currentDevice.info.name}`;
                    },
                  },
                );
              }}
            >
              <CastIcon
                className={cn('w-4 h-4 mr-2', {
                  'text-green-500': currentDevice.transport_id !== null,
                  'text-red-500': currentDevice.transport_id === null,
                })}
              />
              <span>{currentDevice.info.name}</span>
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
            toast.promise(
              emit('cast-global-message', {
                type: 'DISPLAY_LOGS',
                logs: ['Hello from SoulFire!'],
              }),
              {
                loading: 'Broadcasting message...',
                success: 'Message broadcasted!',
                error: (e) => {
                  console.error(e);
                  return 'Failed to broadcast message';
                },
              },
            );
          }}
        >
          <RadioTowerIcon className="w-4 h-4 mr-2" />
          <span>Broadcast test</span>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
}
