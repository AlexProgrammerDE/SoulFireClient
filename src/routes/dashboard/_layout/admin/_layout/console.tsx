import { createFileRoute } from '@tanstack/react-router';
import { TerminalComponent } from '@/components/terminal.tsx';
import CommandInput from '@/components/command-input.tsx';
import UserPageLayout from '@/components/nav/user-page-layout';

export const Route = createFileRoute(
  '/dashboard/_layout/admin/_layout/console',
)({
  component: Console,
});

function Console() {
  return (
    <UserPageLayout
      showUserCrumb={false}
      extraCrumbs={['Admin']}
      pageName="Console"
    >
      <div className="flex flex-col gap-2">
        <TerminalComponent
          scope={{
            oneofKind: 'global',
            global: {},
          }}
        />
        <CommandInput
          scope={{
            oneofKind: 'global',
            global: {},
          }}
        />
      </div>
    </UserPageLayout>
  );
}
