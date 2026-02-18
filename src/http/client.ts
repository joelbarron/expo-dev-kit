import axios from 'axios';

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
