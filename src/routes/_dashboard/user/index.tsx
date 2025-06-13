import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router';
import * as React from 'react';
import { use } from 'react';
import { translateInstanceState } from '@/lib/types.ts';
import UserPageLayout from '@/components/nav/user/user-page-layout.tsx';
import { Card, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { PlusIcon, SearchXIcon } from 'lucide-react';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CreateInstanceContext } from '@/components/dialog/create-instance-dialog.tsx';
import { hasGlobalPermission } from '@/lib/utils.tsx';
import { GlobalPermission } from '@/generated/soulfire/common.ts';
import { Button } from '@/components/ui/button.tsx';

export const Route = createFileRoute('/_dashboard/user/')({
  component: InstanceSelectPage,
});

function InstanceSelectPage() {
  const { t } = useTranslation('common');

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.instances')}>
      <Content />
    </UserPageLayout>
  );
}

function Content() {
  const { t, i18n } = useTranslation('common');
  const { instanceListQueryOptions } = Route.useRouteContext();
  const { data: instanceList } = useSuspenseQuery(instanceListQueryOptions);
  return (
    <>
      {instanceList.instances.length == 0 ? (
        <div className="flex size-full flex-1">
          <div className="m-auto flex flex-col items-center gap-4">
            <div className="flex flex-row gap-2">
              <SearchXIcon className="m-auto size-7" />
              <h1 className="m-auto text-xl font-bold">
                {t('noInstancesFound')}
              </h1>
            </div>
            <CreateInstanceButton />
          </div>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {instanceList.instances.map((instance, index) => (
            <Link
              key={instance.id}
              to="/instance/$instance"
              params={{ instance: instance.id }}
              search={{}}
              className="max-h-fit w-full"
            >
              <Card className="flex w-full flex-row items-center gap-4 px-6">
                <div className="shrink-0 pr-0">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg">
                    <DynamicIcon
                      name={instance.icon}
                      className="size-8 shrink-0"
                    />
                  </div>
                </div>
                <div className="grow">
                  <CardTitle className="max-w-64 truncate">
                    {instance.friendlyName}
                  </CardTitle>
                  <CardDescription className="font-semibold">
                    {translateInstanceState(i18n, instance.state)}
                  </CardDescription>
                </div>
                <div className="ml-auto shrink-0">
                  <p className="mb-auo m-auto text-2xl tracking-widest opacity-60">
                    ⌘{index + 1}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function CreateInstanceButton() {
  const { t } = useTranslation('common');
  const clientDataQueryOptions = useRouteContext({
    from: '/_dashboard',
    select: (context) => context.clientDataQueryOptions,
  });
  const { data: clientInfo } = useSuspenseQuery(clientDataQueryOptions);
  const { openCreateInstance } = use(CreateInstanceContext);

  if (!hasGlobalPermission(clientInfo, GlobalPermission.CREATE_INSTANCE)) {
    return null;
  }

  return (
    <Button onClick={openCreateInstance} variant="outline" className="w-fit">
      <PlusIcon className="size-4" />
      {t('instanceSidebar.createInstance')}
    </Button>
  );
}
