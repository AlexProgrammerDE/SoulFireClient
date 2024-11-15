import { QueryClient } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { deepEqual } from '@tanstack/react-router';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      structuralSharing: (prev: unknown, next: unknown) =>
        deepEqual(prev, next) ? prev : next,
    },
  },
});

broadcastQueryClient({
  queryClient: queryClientInstance,
  broadcastChannel: 'soulfire',
});
