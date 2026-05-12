/**
 * Thin async wrapper over `react-native-purchases` (RevenueCat SDK).
 *
 * `react-native-purchases` is loaded via dynamic require so apps that do
 * not use subscriptions don't pay the native dep cost. If the package is
 * missing or fails to load, calls become safe no-ops and `isPurchasesAvailable()`
 * returns false — the rest of the lib (status from backend) keeps working.
 */
import { Platform } from 'react-native';

type PurchasesModule = any; // intentional: RC SDK types depend on installed version

let purchasesModule: PurchasesModule | null = null;
let purchasesLoadAttempted = false;

const loadPurchases = (): PurchasesModule | null => {
  if (purchasesLoadAttempted) return purchasesModule;
  purchasesLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    purchasesModule = require('react-native-purchases');
    // Some packagers expose default differently.
    if (purchasesModule?.default) {
      purchasesModule = purchasesModule.default;
    }
  } catch (err) {
    purchasesModule = null;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[jb-drf-billing] react-native-purchases not installed; subscriptions disabled.');
    }
  }
  return purchasesModule;
};

export const isPurchasesAvailable = (): boolean => loadPurchases() !== null;

export type ConfigurePurchasesOptions = {
  apiKeyIos?: string;
  apiKeyAndroid?: string;
  appUserId: string;
  debug?: boolean;
};

export const configurePurchases = async (opts: ConfigurePurchasesOptions): Promise<boolean> => {
  const Purchases = loadPurchases();
  if (!Purchases) return false;
  const apiKey = Platform.OS === 'ios' ? opts.apiKeyIos : opts.apiKeyAndroid;
  if (!apiKey) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[jb-drf-billing] Missing RevenueCat API key for', Platform.OS);
    }
    return false;
  }
  try {
    if (opts.debug && typeof Purchases.setLogLevel === 'function') {
      Purchases.setLogLevel('DEBUG');
    }
    await Purchases.configure({ apiKey, appUserID: opts.appUserId });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[jb-drf-billing] configurePurchases failed', err);
    return false;
  }
};

export const loginPurchases = async (appUserId: string) => {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  return Purchases.logIn(appUserId);
};

export const logoutPurchases = async () => {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  try {
    return await Purchases.logOut();
  } catch (err) {
    // Anonymous → logOut throws "Logout not supported". Swallow.
    return null;
  }
};

export const getOfferings = async () => {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  return Purchases.getOfferings();
};

export const purchasePackage = async (pkg: any) => {
  const Purchases = loadPurchases();
  if (!Purchases) throw new Error('react-native-purchases not installed');
  return Purchases.purchasePackage(pkg);
};

export const restorePurchases = async () => {
  const Purchases = loadPurchases();
  if (!Purchases) throw new Error('react-native-purchases not installed');
  return Purchases.restorePurchases();
};

export const getCustomerInfo = async () => {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  return Purchases.getCustomerInfo();
};

export type CustomerInfoListener = (info: any) => void;

export const addCustomerInfoListener = (listener: CustomerInfoListener): (() => void) => {
  const Purchases = loadPurchases();
  if (!Purchases?.addCustomerInfoUpdateListener) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    try {
      Purchases.removeCustomerInfoUpdateListener(listener);
    } catch (err) {
      /* noop */
    }
  };
};
