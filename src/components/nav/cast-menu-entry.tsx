import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { emit, listen } from '@tauri-apps/api/event';
import { cancellablePromiseDefault, cn } from '@/lib/utils.tsx';
import { CastIcon, RadioTowerIcon, SearchXIcon } from 'lucide-react';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
              toast.info(
                t('castMenu.disconnected', {
                  device: device.info.name,
                }),
              );
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
  }, [t]);

  useEffect(() => {
    void invoke('discover_casts');
  }, []);

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <CastIcon />
          <span>{t('castMenu.title')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {devices.length > 0 ? (
              devices.map((currentDevice) => (
                <DropdownMenuItem
                  key={currentDevice.info.id}
                  onClick={() => {
                    if (currentDevice.transport_id !== null) {
                      toast.warning(
                        t('castMenu.alreadyConnected', {
                          device: currentDevice.info.name,
                        }),
                      );
                      return;
                    }

                    toast.promise(
                      invoke('connect_cast', {
                        address: currentDevice.info.address,
                        port: currentDevice.info.port,
                      }),
                      {
                        loading: t('castMenu.connectToast.loading', {
                          device: currentDevice.info.name,
                        }),
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

                          return t('castMenu.connectToast.success', {
                            device: currentDevice.info.name,
                          });
                        },
                        error: (e) => {
                          console.error(e);
                          return t('castMenu.connectToast.error', {
                            device: currentDevice.info.name,
                          });
                        },
                      },
                    );
                  }}
                >
                  <CastIcon
                    className={cn({
                      'text-green-500': currentDevice.transport_id !== null,
                      'text-red-500': currentDevice.transport_id === null,
                    })}
                  />
                  <span>{currentDevice.info.name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem
                disabled
                onClick={() => {
                  toast.warning(t('castMenu.noDevices'));
                }}
              >
                <SearchXIcon />
                <span>{t('castMenu.noDevices')}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast.promise(
                  emit('cast-global-message', {
                    type: 'DISPLAY_LOGS',
                    logs: ['Hello from SoulFire!'],
                  }),
                  {
                    loading: t('castMenu.broadcastToast.loading'),
                    success: t('castMenu.broadcastToast.success'),
                    error: (e) => {
                      console.error(e);
                      return t('castMenu.broadcastToast.error');
                    },
                  },
                );
              }}
            >
              <RadioTowerIcon />
              <span>{t('castMenu.broadcastLabel')}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}
