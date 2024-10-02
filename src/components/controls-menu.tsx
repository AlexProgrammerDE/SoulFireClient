import { useContext } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToProto } from '@/lib/types.ts';
import { toast } from 'sonner';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayIcon, SquareIcon, TimerIcon, TimerOffIcon } from 'lucide-react';

export default function ControlsMenu() {
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const profile = useContext(ProfileContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const startMutation = useMutation({
    mutationFn: () => {
      if (transport === null) {
        return Promise.resolve() as never;
      }

      const client = new InstanceServiceClient(transport);
      const promise = client
        .updateInstanceConfig({
          id: instanceInfo.id,
          config: convertToProto(profile),
        })
        .then(() => {
          return client.changeInstanceState({
            id: instanceInfo.id,
            state: InstanceState.RUNNING,
          });
        });
      toast.promise(promise, {
        loading: 'Starting attack...',
        success: `Attack started successfully`,
        error: (e) => {
          console.error(e);
          return 'Failed to start attack';
        },
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });
  const toggleMutation = useMutation({
    mutationFn: () => {
      if (transport === null) {
        return Promise.resolve() as never;
      }

      const client = new InstanceServiceClient(transport);
      const current = instanceInfo.state;
      const promise = client
        .changeInstanceState({
          id: instanceInfo.id,
          state:
            current === InstanceState.PAUSED
              ? InstanceState.RUNNING
              : InstanceState.PAUSED,
        })
        .then();
      toast.promise(promise, {
        loading: 'Toggling attack state...',
        success: `Attack state toggled to ${current === InstanceState.PAUSED ? 'running' : 'paused'}`,
        error: (e) => {
          console.error(e);
          return 'Failed to toggle attack state';
        },
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });
  const stopMutation = useMutation({
    mutationFn: () => {
      if (transport === null) {
        return Promise.resolve() as never;
      }

      const client = new InstanceServiceClient(transport);
      const promise = client
        .changeInstanceState({
          id: instanceInfo.id,
          state: InstanceState.STOPPED,
        })
        .then();
      toast.promise(promise, {
        loading: 'Stopping attack...',
        success: `Attack stopped successfully`,
        error: (e) => {
          console.error(e);
          return 'Failed to stop attack';
        },
      });

      return promise;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instance-info', instanceInfo.id],
      });
    },
  });

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        className="flex flex-row gap-1"
        variant="secondary"
        onClick={() => startMutation.mutate()}
        disabled={instanceInfo.state !== InstanceState.STOPPED}
      >
        <div>
          <PlayIcon className="h-4" />
        </div>
        <span>Start</span>
      </Button>
      <Button
        className="flex flex-row gap-1"
        variant="secondary"
        onClick={() => toggleMutation.mutate()}
        disabled={
          instanceInfo.state === InstanceState.STOPPING ||
          instanceInfo.state === InstanceState.STOPPED
        }
      >
        <div>
          {instanceInfo.state === InstanceState.PAUSED ? (
            <TimerOffIcon className="h-4" />
          ) : (
            <TimerIcon className="h-4" />
          )}
        </div>
        <span>
          {instanceInfo.state === InstanceState.PAUSED ? 'Resume' : 'Pause'}
        </span>
      </Button>
      <Button
        className="flex flex-row gap-1"
        variant="secondary"
        onClick={() => stopMutation.mutate()}
        disabled={
          instanceInfo.state === InstanceState.STOPPING ||
          instanceInfo.state === InstanceState.STOPPED
        }
      >
        <div>
          <SquareIcon className="h-4" />
        </div>
        <span>Stop</span>
      </Button>
    </div>
  );
}
