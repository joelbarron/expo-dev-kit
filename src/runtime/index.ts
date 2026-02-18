import AsyncStorage from '@react-native-async-storage/async-storage';

import { createJBAppConfigStore, CreateJBAppConfigStoreOptions } from '../store/appConfigStore';
import { createJBAuthStore, CreateJBAuthStoreOptions } from '../store/authStore';
import { createJBThemeStore, CreateJBThemeStoreOptions } from '../store/themeStore';
import { configureJBThemeColors, JBThemeColors } from '../utils/colors';

type RuntimeThemeOptions = Omit<CreateJBThemeStoreOptions, 'storage'> & {
  colors?: JBThemeColors;
};

type RuntimeStoreOptions = {
  storage?: any;
  auth?: Omit<CreateJBAuthStoreOptions, 'storage'>;
  theme?: RuntimeThemeOptions;
  appConfig?: Omit<CreateJBAppConfigStoreOptions<any, any>, 'storage'>;
};

let authStore = createJBAuthStore({
  storage: AsyncStorage
});

let themeStore = createJBThemeStore({
  storage: AsyncStorage
});

let appConfigStore = createJBAppConfigStore({
  storage: AsyncStorage
});

export const configureJBExpoRuntime = (options?: RuntimeStoreOptions) => {
  const storage = options?.storage ?? AsyncStorage;
  const themeOptions = options?.theme ?? {};
  const { colors, ...themeStoreOptions } = themeOptions;

  authStore = createJBAuthStore({
    storage,
    ...(options?.auth ?? {})
  });

  themeStore = createJBThemeStore({
    storage,
    ...themeStoreOptions
  });
  configureJBThemeColors(colors);

  appConfigStore = createJBAppConfigStore({
    storage,
    ...(options?.appConfig ?? {})
  });
};

type Selector<TState, TSelected> = (state: TState) => TSelected;

export const useAuthStore: any = <TSelected = any>(
  selector?: Selector<any, TSelected>
): TSelected | any => {
  if (selector) {
    return authStore(selector);
  }
  return authStore();
};

useAuthStore.getState = () => authStore.getState();
useAuthStore.setState = (partial: any, replace?: boolean) =>
  replace === true ? authStore.setState(partial, true) : authStore.setState(partial);
useAuthStore.subscribe = (listener: any) => authStore.subscribe(listener);

export const useThemeStore: any = <TSelected = any>(
  selector?: Selector<any, TSelected>
): TSelected | any => {
  if (selector) {
    return themeStore(selector);
  }
  return themeStore();
};

useThemeStore.getState = () => themeStore.getState();
useThemeStore.setState = (partial: any, replace?: boolean) =>
  replace === true ? themeStore.setState(partial, true) : themeStore.setState(partial);
useThemeStore.subscribe = (listener: any) => themeStore.subscribe(listener);

export const useAppConfigStore: any = <TSelected = any>(
  selector?: Selector<any, TSelected>
): TSelected | any => {
  if (selector) {
    return appConfigStore(selector);
  }
  return appConfigStore();
};

useAppConfigStore.getState = () => appConfigStore.getState();
useAppConfigStore.setState = (partial: any, replace?: boolean) =>
  replace === true ? appConfigStore.setState(partial, true) : appConfigStore.setState(partial);
useAppConfigStore.subscribe = (listener: any) => appConfigStore.subscribe(listener);
