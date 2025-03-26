import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import '@/lib/i18n';
import { routeTree } from './routeTree.gen';
import { getServerType, isAuthenticated } from '@/lib/web-rpc.ts';
import { ErrorComponent } from '@/components/error-component.tsx';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { NotFoundComponent } from '@/components/not-found-component.tsx';

const hashHistory = createHashHistory();

// Create a new router instance
const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 10_000,
  scrollRestoration: true,
  scrollRestorationBehavior: 'auto',
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: LoadingComponent,
  defaultNotFoundComponent: NotFoundComponent,
  defaultStructuralSharing: true,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

if (
  isAuthenticated() &&
  getServerType() === 'dedicated' &&
  window.location.hash === ''
) {
  window.location.hash = '/dashboard/user';
}

// Render the app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
