import { createFileRoute } from '@tanstack/react-router';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TransportContext } from '@/components/providers/transport-context.tsx';
import {
  ComponentTitle,
  GenericEntryComponent,
} from '@/components/settings-page.tsx';
import { StringSetting_InputType } from '@/generated/soulfire/common.ts';
import { JsonValue } from '@protobuf-ts/runtime/build/types/json-typings';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { setSelfEmail, setSelfUsername } from '@/lib/utils.tsx';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import { ExternalLink } from '@/components/external-link.tsx';
import { UserAvatar } from '@/components/user-avatar.tsx';

export const Route = createFileRoute('/_dashboard/user/settings')({
  component: UserSettings,
});

function UserSettings() {
  const { t } = useTranslation('common');
  const { clientDataQueryOptions } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const transport = useContext(TransportContext);
  const clientInfo = useContext(ClientInfoContext);
  const setUsernameMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await setSelfUsername(
        value as string,
        transport,
        queryClient,
        clientDataQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: clientDataQueryOptions.queryKey,
      });
    },
  });
  const setEmailMutation = useMutation({
    mutationFn: async (value: JsonValue) => {
      await setSelfEmail(
        value as string,
        transport,
        queryClient,
        clientDataQueryOptions.queryKey,
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: clientDataQueryOptions.queryKey,
      });
    },
  });

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.settings')}>
      <div className="flex h-full w-full max-w-4xl grow flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex max-w-xl flex-col gap-1">
            <ComponentTitle
              title="Avatar"
              description={
                <>
                  Your user avatar is based on your account email address. You
                  can change the avatar for your email address at{' '}
                  <ExternalLink
                    className="font-semibold underline-offset-4 hover:underline"
                    href="https://gravatar.com"
                  >
                    Gravatar
                  </ExternalLink>
                  .
                </>
              }
            />
            <div className="flex items-center gap-2 text-left text-base">
              <UserAvatar
                username={clientInfo.username}
                email={clientInfo.email}
                className="size-10"
              />
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-semibold">
                  {clientInfo.username}
                </span>
                <span className="truncate text-sm">{clientInfo.email}</span>
              </div>
            </div>
          </div>
          <GenericEntryComponent
            entry={{
              oneofKind: 'string',
              string: {
                uiName: 'Username',
                description:
                  'Your username is used to identify you in the UI and in logs.',
                def: '',
                inputType: StringSetting_InputType.TEXT,
                placeholder: 'username',
                minLength: 3,
                maxLength: 32,
                pattern: '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?',
              },
            }}
            value={clientInfo.username}
            changeCallback={setUsernameMutation.mutate}
          />
          <GenericEntryComponent
            entry={{
              oneofKind: 'string',
              string: {
                uiName: 'Email',
                description: 'Your email is used for login and notifications.',
                def: '',
                inputType: StringSetting_InputType.EMAIL,
                placeholder: 'root@soulfiremc.com',
                minLength: 3,
                maxLength: 255,
                pattern: '.*',
              },
            }}
            value={clientInfo.email}
            changeCallback={setEmailMutation.mutate}
          />
        </div>
      </div>
    </UserPageLayout>
  );
}
