import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { translateInstanceState } from '@/lib/types.ts';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { SearchXIcon } from 'lucide-react';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

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
          <div className="m-auto flex flex-row gap-2">
            <SearchXIcon className="m-auto size-7" />
            <h1 className="m-auto text-xl font-bold">
              {t('noInstancesFound')}
            </h1>
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
              <Card className="flex w-full flex-row">
                <CardHeader className="pr-0">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg">
                    <DynamicIcon
                      name={instance.icon}
                      className="size-8 shrink-0"
                    />
                  </div>
                </CardHeader>
                <CardHeader>
                  <CardTitle className="max-w-64 truncate">
                    {instance.friendlyName}
                  </CardTitle>
                  <CardDescription className="font-semibold">
                    {translateInstanceState(i18n, instance.state)}
                  </CardDescription>
                </CardHeader>
                <CardHeader className="ml-auto">
                  <p className="mb-auo m-auto text-2xl tracking-widest opacity-60">
                    ⌘{index + 1}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
