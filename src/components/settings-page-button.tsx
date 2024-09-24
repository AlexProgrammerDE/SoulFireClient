import { useContext } from 'react';
import { Link } from '@tanstack/react-router';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { Button } from '@/components/ui/button.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { SettingsPage } from '@/generated/soulfire/config.ts';

export default function SettingsPageButton({ page }: { page: SettingsPage }) {
  const instanceInfo = useContext(InstanceInfoContext);
  return (
    <Button
      asChild
      variant="secondary"
      className="h-full w-full flex flex-row gap-1"
    >
      <Link
        to="/dashboard/$instance/settings/$namespace"
        params={{
          instance: instanceInfo.id,
          namespace: page.namespace,
        }}
        search={{}}
      >
        <div>
          <DynamicIcon name={page.iconId as never} className="h-4" />
        </div>
        <span>{page.pageName}</span>
      </Link>
    </Button>
  );
}
