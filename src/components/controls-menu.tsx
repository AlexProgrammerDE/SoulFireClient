import { useCallback, useContext, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ServerConnectionContext } from '@/components/providers/server-context.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToProto } from '@/lib/types.ts';
import { toast } from 'sonner';
import { InstanceServiceClient } from '@/generated/com/soulfiremc/grpc/generated/instance.client.ts';
import { InstanceState } from '@/generated/com/soulfiremc/grpc/generated/instance.ts';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';

type State = 'unstarted' | 'paused' | 'running';

export default function ControlsMenu() {
  const [appState, setAppState] = useState<State>('unstarted');
  const transport = useContext(ServerConnectionContext);
  const profile = useContext(ProfileContext);
  const instanceInfo = useContext(InstanceInfoContext);

  const startAttack = useCallback(() => {
    const client = new InstanceServiceClient(transport);
    toast.promise(
      async () => {
        await client.updateInstanceConfig({
          id: instanceInfo.id,
          config: convertToProto(profile.profile),
        });
        await client.changeInstanceState({
          id: instanceInfo.id,
          state: InstanceState.RUNNING,
        });
        setAppState('running');
      },
      {
        loading: 'Starting attack...',
        success: `Attack started successfully`,
        error: (e) => {
          console.error(e);
          return 'Failed to start attack';
        },
      },
    );
  }, [profile, transport]);

  const toggleAttackState = useCallback(() => {
    const client = new InstanceServiceClient(transport);
    toast.promise(
      client
        .changeInstanceState({
          id: instanceInfo.id,
          state:
            appState === 'paused'
              ? InstanceState.RUNNING
              : InstanceState.PAUSED,
        })
        .then(() => {
          setAppState(appState === 'paused' ? 'running' : 'paused');
        }),
      {
        loading: 'Toggling attack state...',
        success: `Attack state toggled to ${appState === 'paused' ? 'running' : 'paused'}`,
        error: (e) => {
          console.error(e);
          return 'Failed to toggle attack state';
        },
      },
    );
  }, [appState, instanceInfo, transport]);

  const stopAttack = useCallback(() => {
    const client = new InstanceServiceClient(transport);
    toast.promise(
      client
        .changeInstanceState({
          id: instanceInfo.id,
          state: InstanceState.STOPPED,
        })
        .then(() => {
          setAppState('unstarted');
        }),
      {
        loading: 'Stopping attack...',
        success: `Attack stopped successfully`,
        error: (e) => {
          console.error(e);
          return 'Failed to stop attack';
        },
      },
    );
  }, [instanceInfo, transport]);

  return (
    <div className="grid grid-rows-3 gap-4">
      <Button
        className="h-full w-full"
        variant="secondary"
        onClick={startAttack}
        disabled={appState !== 'unstarted'}
      >
        Start
      </Button>
      <Button
        className="h-full w-full"
        variant="secondary"
        onClick={toggleAttackState}
        disabled={appState === 'unstarted'}
      >
        {appState === 'paused' ? 'Resume' : 'Pause'}
      </Button>
      <Button
        className="h-full w-full"
        variant="secondary"
        onClick={stopAttack}
        disabled={appState === 'unstarted'}
      >
        Stop
      </Button>
    </div>
  );
}
