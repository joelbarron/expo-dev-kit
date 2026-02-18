import axios, { AxiosInstance } from 'axios';

import { AppStatusResponse } from './types';

export type CreateAppStatusClientOptions = {
  baseUrl: string;
  endpoint?: string;
  axiosInstance?: AxiosInstance;
};

export type AppStatusClient = {
  getStatus: () => Promise<AppStatusResponse>;
};

const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/+$/, '');

export const createAppStatusClient = (options: CreateAppStatusClientOptions): AppStatusClient => {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = options.endpoint ?? '/app/status/';
  const http =
    options.axiosInstance ??
    axios.create({
      baseURL: baseUrl
    });

  const getStatus = async (): Promise<AppStatusResponse> => {
    const response = await http.get<AppStatusResponse>(
      endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`
    );

    return response.data;
  };

  return {
    getStatus
  };
};
