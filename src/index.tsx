import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createHashHistory,
  createRouter,
  deepEqual,
  RouterProvider,
} from '@tanstack/react-router';
import '@/lib/i18n';
import { routeTree } from './routeTree.gen';
import { getServerType, isAuthenticated } from '@/lib/web-rpc.ts';
import { ErrorComponent } from '@/components/error-component.tsx';
import { LoadingComponent } from '@/components/loading-component.tsx';
import { NotFoundComponent } from '@/components/not-found-component.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';

const hashHistory = createHashHistory();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retries on an initial load failure
      retry: 5,
      structuralSharing: (prev: unknown, next: unknown) =>
        deepEqual(prev, next) ? prev : next,
    },
  },
});

broadcastQueryClient({
  queryClient: queryClient,
  broadcastChannel: 'soulfire',
});

// noinspection JSUnusedGlobalSymbols
const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  scrollRestorationBehavior: 'auto',
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: LoadingComponent,
  defaultNotFoundComponent: NotFoundComponent,
  defaultStructuralSharing: true,
  context: { queryClient },
  Wrap: ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  // noinspection JSUnusedGlobalSymbols
  interface Register {
    router: typeof router;
  }
}

if (
  isAuthenticated() &&
  getServerType() === 'dedicated' &&
  window.location.hash === ''
) {
  window.location.hash = '/user';
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
