import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar.tsx';
import { UserSidebar } from '@/components/nav/user-sidebar.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx';

export const Route = createFileRoute('/_dashboard/user')({
  component: UserLayout,
});

function UserLayout() {
  const defaultOpen = localStorage.getItem('sidebar:state') === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <UserSidebar />
      <TooltipProvider delayDuration={500}>
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
