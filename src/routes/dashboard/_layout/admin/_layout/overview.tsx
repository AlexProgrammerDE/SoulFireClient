import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/dashboard/_layout/admin/_layout/overview',
)({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="grow flex h-full w-full flex-col gap-2 py-2 pl-2">
      <p>SoulFire admin dashboard!</p>
    </div>
  );
}
