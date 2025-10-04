declare module '@tanstack/react-query' {
  import type { QueryClientConfig } from '@tanstack/query-core';
  import type { ReactNode } from 'react';

  export class QueryClient {
    constructor(config?: QueryClientConfig);
    invalidateQueries(options: { queryKey: unknown[] }): Promise<void>;
  }

  export interface QueryClientProviderProps {
    client: QueryClient;
    children?: ReactNode;
  }

  export function QueryClientProvider(props: QueryClientProviderProps): JSX.Element;

  export function useQuery(...args: any[]): any;
  export function useMutation(...args: any[]): any;
  export function useQueryClient(): QueryClient;
}
