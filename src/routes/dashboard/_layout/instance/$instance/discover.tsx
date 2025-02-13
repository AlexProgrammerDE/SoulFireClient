import { createFileRoute } from '@tanstack/react-router';
import InstancePageLayout from '@/components/nav/instance-page-layout.tsx';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute(
  '/dashboard/_layout/instance/$instance/discover',
)({
  component: Discover,
});

function Discover() {
  const { t } = useTranslation('common');

  return (
    <InstancePageLayout
      extraCrumbs={[t('breadcrumbs.plugins')]}
      pageName={t('pageName.discoverPlugins')}
    >
      <div className="grow flex h-full w-full flex-col gap-2 pb-4">
        SUPER TODO
      </div>
    </InstancePageLayout>
  );
}
