import { createFileRoute, Link } from '@tanstack/react-router';
import * as React from 'react';
import { useContext } from 'react';
import { translateInstanceState } from '@/lib/types.ts';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
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

export const Route = createFileRoute('/dashboard/user/instances')({
  component: InstanceSelectPage,
});

function InstanceSelectPage() {
  const { t, i18n } = useTranslation('common');
  const instanceList = useContext(InstanceListContext);

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.instances')}>
      {instanceList.instances.length == 0 ? (
        <div className="flex flex-1 size-full">
          <div className="m-auto flex flex-row gap-2">
            <SearchXIcon className="size-7 m-auto" />
            <h1 className="text-xl font-bold m-auto">
              {t('noInstancesFound')}
            </h1>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
          {instanceList.instances.map((instance, index) => (
            <Link
              key={instance.id}
              to="/dashboard/instance/$instance/console"
              params={{ instance: instance.id }}
              search={{}}
              className="w-full max-h-fit"
            >
              <Card className="w-full flex flex-row">
                <CardHeader className="pr-0">
                  <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <DynamicIcon
                      name={instance.icon}
                      className="size-8 shrink-0"
                    />
                  </div>
                </CardHeader>
                <CardHeader>
                  <CardTitle>{instance.friendlyName}</CardTitle>
                  <CardDescription className="font-semibold">
                    {translateInstanceState(i18n, instance.state)}
                  </CardDescription>
                </CardHeader>
                <CardHeader className="ml-auto">
                  <p className="m-auto mb-auo text-2xl tracking-widest opacity-60">
                    ⌘{index + 1}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </UserPageLayout>
  );
}
