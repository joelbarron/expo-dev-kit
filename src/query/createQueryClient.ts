import {
  DefaultOptions,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientConfig
} from '@tanstack/react-query';

import { isUnauthorizedError } from './http';

export type CreateExpoQueryClientOptions = {
  onUnauthorized?: (error: unknown) => void;
  defaultOptions?: DefaultOptions;
  config?: Omit<QueryClientConfig, 'defaultOptions' | 'queryCache' | 'mutationCache'>;
};

export const createExpoQueryClient = (options?: CreateExpoQueryClientOptions): QueryClient => {
  const onError = (error: unknown) => {
    if (options?.onUnauthorized && isUnauthorizedError(error)) {
      options.onUnauthorized(error);
    }
  };

  return new QueryClient({
    ...(options?.config ?? {}),
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        ...(options?.defaultOptions?.queries ?? {})
      },
      mutations: {
        retry: 0,
        ...(options?.defaultOptions?.mutations ?? {})
      }
    },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError })
  });
};
