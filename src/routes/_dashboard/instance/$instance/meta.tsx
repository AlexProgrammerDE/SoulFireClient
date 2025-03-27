import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  formatIconName,
  setInstanceFriendlyName,
  setInstanceIcon,
} from '@/lib/utils.tsx';
import { GenericEntryComponent } from '@/components/settings-page.tsx';
import { getAllIconTags } from '@/components/dynamic-icon.tsx';
import { StringSetting_InputType } from '@/generated/soulfire/common.ts';
import { JsonValue } from '@protobuf-ts/runtime/build/types/json-typings';

export const Route = createFileRoute('/_dashboard/instance/$instance/meta')({
  component: MetaSettings,
});

function MetaSettings() {
  const { t } = useTranslation('common');
  const { instanceInfoQueryOptions, instanceListQueryOptions } =
    Route.useRouteContext();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const instanceInfo = useContext(InstanceInfoContext);
  const setFriendlyNameMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await setInstanceFriendlyName(
        value as string,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
        instanceListQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: instanceInfoQueryOptions.queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: instanceListQueryOptions.queryKey,
        }),
      ]);
    },
  });
  const setIconMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await setInstanceIcon(
        value as string,
        instanceInfo,
        transport,
        queryClient,
        instanceInfoQueryOptions.queryKey,
        instanceListQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: instanceInfoQueryOptions.queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: instanceListQueryOptions.queryKey,
        }),
      ]);
    },
  });

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.settings')]}
      pageName={t('pageName.metaSettings')}
    >
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <div className="flex flex-col gap-2">
          <GenericEntryComponent
            entry={{
              oneofKind: 'string',
              string: {
                uiName: 'Friendly Name',
                description:
                  'The name of the instance that will be displayed in the UI.',
                def: '',
                inputType: StringSetting_InputType.TEXT,
                placeholder: 'My Instance',
                minLength: 3,
                maxLength: 32,
                pattern: '[a-zA-Z0-9 ]+',
              },
            }}
            value={instanceInfo.friendlyName}
            changeCallback={setFriendlyNameMutation.mutate}
          />
          <GenericEntryComponent
            entry={{
              oneofKind: 'combo',
              combo: {
                uiName: 'Icon',
                description:
                  'The icon of the instance that will be displayed in the UI.',
                options: getAllIconTags().map((iconName) => ({
                  id: iconName[0],
                  displayName: formatIconName(iconName[0]),
                  iconId: iconName[0],
                  keywords: iconName[1],
                })),
                def: '',
              },
            }}
            value={instanceInfo.icon}
            changeCallback={setIconMutation.mutate}
          />
        </div>
      </div>
    </InstancePageLayout>
  );
}
