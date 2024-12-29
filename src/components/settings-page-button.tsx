import { useContext } from 'react';
import { Link } from '@tanstack/react-router';
import DynamicIcon from '@/components/dynamic-icon.tsx';
import { buttonVariants } from '@/components/ui/button.tsx';
import { InstanceInfoContext } from '@/components/providers/instance-info-context.tsx';
import { SettingsPage } from '@/generated/soulfire/config.ts';
import { cn } from '@/lib/utils.ts';

export default function SettingsPageButton({ page }: { page: SettingsPage }) {
  const instanceInfo = useContext(InstanceInfoContext);
  return (
    <Link
      to="/dashboard/instance/$instance/settings/$namespace"
      params={{
        instance: instanceInfo.id,
        namespace: page.namespace,
      }}
      activeProps={{
        className: cn(
          buttonVariants({ variant: 'default', size: 'sm' }),
          'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
          'justify-start',
        ),
      }}
      inactiveProps={{
        className: cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'justify-start',
        ),
      }}
    >
      <div>
        <DynamicIcon name={page.iconId as never} className="mr-2 h-4 w-4" />
      </div>
      <span>{page.pageName}</span>
    </Link>
  );
}
