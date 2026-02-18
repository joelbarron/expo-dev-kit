import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthClient } from './client';
import {
  JbDrfWebAuthResponse,
  LinkSocialPayload,
  LoginBasicPayload,
  LoginSocialPayload,
  SwitchProfilePayload,
  UnlinkSocialPayload
} from './types';

export const authQueryKeys = {
  all: ['auth'] as const,
  me: () => [...authQueryKeys.all, 'me'] as const,
  social: () => [...authQueryKeys.all, 'social'] as const
};

export const createAuthQueryHooks = (
  authClient: Pick<
    AuthClient,
    | 'getMe'
    | 'loginBasic'
    | 'loginSocial'
    | 'linkSocial'
    | 'unlinkSocial'
    | 'switchProfile'
    | 'logout'
  >
) => {
  const useMeQuery = (enabled = true) =>
    useQuery({
      queryKey: authQueryKeys.me(),
      queryFn: () => authClient.getMe(),
      enabled
    });

  const useLoginMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LoginBasicPayload) => authClient.loginBasic(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useSwitchProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: SwitchProfilePayload) => authClient.switchProfile(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useSocialLoginMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LoginSocialPayload) => authClient.loginSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useLinkSocialMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LinkSocialPayload) => authClient.linkSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.social() });
      }
    });
  };

  const useUnlinkSocialMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: UnlinkSocialPayload) => authClient.unlinkSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.social() });
      }
    });
  };

  const useLogoutMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (): Promise<void> => {
        await authClient.logout();
      },
      onSuccess: async () => {
        queryClient.setQueryData<JbDrfWebAuthResponse | null>(authQueryKeys.me(), null);
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  return {
    useMeQuery,
    useLoginMutation,
    useSocialLoginMutation,
    useLinkSocialMutation,
    useUnlinkSocialMutation,
    useSwitchProfileMutation,
    useLogoutMutation
  };
};
