import axios from 'axios';

import { getOfflineMutationCheck } from '../core/offline';

export type ConfigureJBHttpClientOptions = {
  baseURL?: string;
};

const mapAxiosError = (error: any) => {
  throw {
    statusCode: error?.response?.status,
    data: error?.response?.data,
    message: error?.message
  };
};

export const customAxiosAuthenticated = axios.create();
export const customAxios = axios.create();

const requestMutationGuard = (config: any) => {
  const method = String(config?.method ?? 'get').toLowerCase();
  const isMutation = !['get', 'head', 'options'].includes(method);

  if (!isMutation) {
    return config;
  }

  const check = getOfflineMutationCheck();
  if (check.allowed) {
    return config;
  }

  return Promise.reject({
    statusCode: 0,
    data: {
      detail: check.reason ?? 'No puedes realizar esta acción sin conexión.',
      code: 'offline_mutation_blocked'
    },
    response: {
      status: 0,
      data: {
        detail: check.reason ?? 'No puedes realizar esta acción sin conexión.',
        code: 'offline_mutation_blocked'
      }
    },
    message: check.reason ?? 'No puedes realizar esta acción sin conexión.'
  });
};

customAxiosAuthenticated.interceptors.request.use(requestMutationGuard);
customAxios.interceptors.request.use(requestMutationGuard);
customAxiosAuthenticated.interceptors.response.use((response) => response, mapAxiosError);
customAxios.interceptors.response.use((response) => response, mapAxiosError);

export const configureJBHttpClient = (options?: ConfigureJBHttpClientOptions) => {
  const baseURL = options?.baseURL;
  customAxiosAuthenticated.defaults.baseURL = baseURL;
  customAxios.defaults.baseURL = baseURL;
};

export const setAxiosAuthToken = (token?: string) => {
  if (token) {
    customAxiosAuthenticated.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete customAxiosAuthenticated.defaults.headers.common.Authorization;
  }
};
