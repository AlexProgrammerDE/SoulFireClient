import { createFileRoute } from '@tanstack/react-router';
import InstancePageLayout from '@/components/nav/instance/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';
import { PluginInfoCard } from '@/components/plugin-info-card.tsx';
import { useSuspenseQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_dashboard/instance/$instance/discover')(
  {
    component: Discover,
  },
);

function Discover() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: 'plugins',
          content: t('breadcrumbs.plugins'),
        },
      ]}
      pageName={t('pageName.discoverPlugins')}
    >
      <Content />
    </InstancePageLayout>
  );
}

function Content() {
  const { instanceInfoQueryOptions } = Route.useRouteContext();
  const { data: instanceInfo } = useSuspenseQuery(instanceInfoQueryOptions);

  return (
    <div className="grid h-full w-full grow grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instanceInfo.instanceSettings
        .filter(
          (settings) =>
            settings.owningPlugin !== undefined && settings.enabledKey !== null,
        )
        .map((settings) => (
          <PluginInfoCard key={settings.namespace} settingsEntry={settings} />
        ))}
    </div>
  );
}
