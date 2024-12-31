import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useContext } from 'react';
import { InstanceState } from '@/generated/soulfire/instance.ts';
import { getEnumKeyByValue } from '@/lib/types.ts';
import { instanceIconPool, selectRandomEntry } from '@/lib/utils.ts';
import { ClientInfoContext } from '@/components/providers/client-info-context.tsx';
import { InstanceListContext } from '@/components/providers/instance-list-context.tsx';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';

export const Route = createFileRoute('/dashboard/_layout/')({
  component: InstanceSelectPage,
});

function InstanceSelectPage() {
  const navigate = useNavigate();
  const clientInfo = useContext(ClientInfoContext);
  const instanceList = useContext(InstanceListContext);

  return (
    <UserPageLayout pageName="Instances">
      {instanceList.instances.length == 0 ? (
        <div className="flex flex-col gap-4 p-4">
          <h1>No instances found</h1>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
          {instanceList.instances.map((instance) => {
            const InstanceIcon = selectRandomEntry(
              instanceIconPool,
              instance.id,
            );
            return (
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
                      <InstanceIcon className="size-8 shrink-0" />
                    </div>
                  </CardHeader>
                  <CardHeader>
                    <CardTitle>{instance.friendlyName}</CardTitle>
                    <CardDescription>
                      {getEnumKeyByValue(InstanceState, instance.state)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </UserPageLayout>
  );
}
