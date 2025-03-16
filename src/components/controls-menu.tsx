import { useContext } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { ProfileContext } from '@/components/providers/profile-context.tsx';
import { convertToInstanceProto } from '@/lib/types.ts';
import { toast } from 'sonner';
import { InstanceServiceClient } from '@/generated/soulfire/instance.client.ts';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlayIcon, SquareIcon, TimerIcon, TimerOffIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouteContext } from '@tanstack/react-router';

export default function ControlsMenu() {
  const { t } = useTranslation('common');
  const instanceInfoQueryOptions = useRouteContext({
    from: '/dashboard/instance/$instance',
    select: (context) => context.instanceInfoQueryOptions,
  });
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
          config: convertToInstanceProto(profile),
        })
        .then(() => {
          return client.changeInstanceState({
            id: instanceInfo.id,
            state: InstanceState.RUNNING,
          });
        });
      toast.promise(promise, {
        loading: t('controls.startToast.loading'),
        success: t('controls.startToast.success'),
        error: (e) => {
          console.error(e);
          return t('controls.startToast.error');
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
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
      if (current === InstanceState.PAUSED) {
        toast.promise(promise, {
          loading: t('controls.resumeToast.loading'),
          success: t('controls.resumeToast.success'),
          error: (e) => {
            console.error(e);
            return t('controls.resumeToast.error');
          },
        });
      } else {
        toast.promise(promise, {
          loading: t('controls.pauseToast.loading'),
          success: t('controls.pauseToast.success'),
          error: (e) => {
            console.error(e);
            return t('controls.pauseToast.error');
          },
        });
      }

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
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
        loading: t('controls.stopToast.loading'),
        success: t('controls.stopToast.success'),
        error: (e) => {
          console.error(e);
          return t('controls.stopToast.error');
        },
      });

      return promise;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        variant="secondary"
        onClick={() => startMutation.mutate()}
        disabled={instanceInfo.state !== InstanceState.STOPPED}
      >
        <PlayIcon className="h-4" />
        {t('controls.start')}
      </Button>
      <Button
        variant="secondary"
        onClick={() => toggleMutation.mutate()}
        disabled={
          instanceInfo.state === InstanceState.STOPPING ||
          instanceInfo.state === InstanceState.STOPPED
        }
      >
        {instanceInfo.state === InstanceState.PAUSED ? (
          <TimerOffIcon className="h-4" />
        ) : (
          <TimerIcon className="h-4" />
        )}
        {instanceInfo.state === InstanceState.PAUSED
          ? t('controls.resume')
          : t('controls.pause')}
      </Button>
      <Button
        variant="secondary"
        onClick={() => stopMutation.mutate()}
        disabled={
          instanceInfo.state === InstanceState.STOPPING ||
          instanceInfo.state === InstanceState.STOPPED
        }
      >
        <SquareIcon className="h-4" />
        {t('controls.stop')}
      </Button>
    </div>
  );
}
