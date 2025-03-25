import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import { setInstanceFriendlyName, setInstanceIcon } from '@/lib/utils.tsx';
import {
  ComboComponent,
  ComponentTitle,
  StringComponent,
} from '@/components/settings-page.tsx';
import { getAllIconNames } from '@/components/dynamic-icon.tsx';

export const Route = createFileRoute('/dashboard/instance/$instance/meta')({
  component: MetaSettings,
});

function MetaSettings() {
  const { t } = useTranslation('common');
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const setFriendlyNameMutation = useMutation({
    mutationFn: async (value: string) => {
      await setInstanceFriendlyName(
        value,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });
  const setIconMutation = useMutation({
    mutationFn: async (value: string) => {
      await setInstanceIcon(
        value,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: instanceInfoQueryOptions.queryKey,
      });
    },
  });

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.metaSettings')}
    >
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title="Friendly Name"
              description="The name of the instance that will be displayed in the UI."
            />
            <StringComponent
              setting={{
                uiName: '',
                description: '',
                def: '',
                secret: false,
                textarea: false,
                placeholder: 'My Instance',
              }}
              value={instanceInfo.friendlyName}
              changeCallback={setFriendlyNameMutation.mutate}
            />
          </div>
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title="Icon"
              description="The icon of the instance that will be displayed in the UI."
            />
            <ComboComponent
              setting={{
                uiName: '',
                description: '',
                options: getAllIconNames().map((iconName) => ({
                  id: iconName,
                  displayName: iconName,
                })),
                def: '',
              }}
              value={instanceInfo.icon}
              changeCallback={setIconMutation.mutate}
            />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
