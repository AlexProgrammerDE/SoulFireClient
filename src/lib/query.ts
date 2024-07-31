import { QueryClient } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';

export const queryClientInstance = new QueryClient();

broadcastQueryClient({
  queryClient: queryClientInstance,
  broadcastChannel: 'soulfire',
});
