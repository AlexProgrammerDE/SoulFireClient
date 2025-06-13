import { createFileRoute } from '@tanstack/react-router';
import { InstanceSettingsPageComponent } from '@/components/settings-page.tsx';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { useTranslation } from 'react-i18next';
import { NotFoundComponent } from '@/components/not-found-component.tsx';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { Suspense } from 'react';

export const Route = createFileRoute(
  '/_dashboard/instance/$instance/settings/$namespace',
)({
  component: SettingsNamespace,
});

function SettingsNamespace() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <Content />
    </Suspense>
  );
}

function ContentSkeleton() {
  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'loading',
          content: <Skeleton className="h-4 w-24" />,
        },
      ]}
      pageName={<Skeleton className="h-4 w-24" />}
    >
      <LoadingComponent />
    </InstancePageLayout>
  );
}

function Content() {
  const { t } = useTranslation('common');
  const { namespace } = Route.useParams();
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);
  const settingsEntry = instanceInfo.instanceSettings.find(
    (s) => s.namespace === namespace,
  );
  if (!settingsEntry) {
    return <NotFoundComponent />;
  }

  return (
    <InstancePageLayout
      extraCrumbs={[
        settingsEntry.owningPlugin
          ? {
              id: 'plugin',
              content: t('breadcrumbs.plugins'),
            }
          : {
              id: 'settings',
              content: t('breadcrumbs.settings'),
            },
      ]}
      pageName={settingsEntry.pageName}
    >
      <div className="flex h-full w-full grow flex-row gap-2">
        <div className="flex h-full grow flex-col gap-4">
          {settingsEntry.owningPlugin && (
            <PluginInfoCard settingsEntry={settingsEntry} />
          )}
          <div className="flex flex-col gap-2">
            <InstanceSettingsPageComponent data={settingsEntry} />
          </div>
        </div>
      </div>
    </InstancePageLayout>
  );
}
