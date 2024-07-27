import { QueryClient } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';

export const queryClient = new QueryClient();

broadcastQueryClient({
  queryClient,
  broadcastChannel: 'soulfire',
});
