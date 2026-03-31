import { Platform } from 'react-native';

type JBLoginDeviceInfo = {
  platform: string;
  name: string;
  token?: string;
  notificationToken?: string;
};

type JBLoginDeviceInfoOptions = {
  requestNotificationPermission?: boolean;
};

const resolveFallbackName = (platform: string): string => {
  const model =
    (Platform as any)?.constants?.Model ||
    (Platform as any)?.constants?.model;
  if (model) {
    return String(model);
  }
  return `${platform}-device`;
};

const resolveFallbackToken = (platform: string): string => {
  const systemVersion = String((Platform as any)?.Version ?? 'unknown');
  return `${platform}-${systemVersion}`;
};

const getNotificationToken = async (
  options?: JBLoginDeviceInfoOptions
): Promise<string | undefined> => {
  if (Platform.OS === 'web') {
    return undefined;
  }

  try {
    const Notifications = await import('expo-notifications');
    const currentPermissions = await Notifications.getPermissionsAsync();
    let status = currentPermissions.status;

    if (status !== 'granted' && options?.requestNotificationPermission) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') {
      return undefined;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync();
    return pushToken?.data || undefined;
  } catch {
    return undefined;
  }
};

const getDeviceIdentityToken = async (): Promise<string | undefined> => {
  if (Platform.OS === 'web') {
    return undefined;
  }

  try {
    const Application = await import('expo-application');
    if (Platform.OS === 'android') {
      return Application.getAndroidId() || undefined;
    }
    if (Platform.OS === 'ios') {
      return (await Application.getIosIdForVendorAsync()) || undefined;
    }
  } catch {
    // Ignore and fallback.
  }
  return undefined;
};

const getDeviceName = async (platform: string): Promise<string> => {
  if (Platform.OS === 'web') {
    return resolveFallbackName(platform);
  }

  try {
    const Device = await import('expo-device');
    return (
      Device.deviceName ||
      Device.modelName ||
      resolveFallbackName(platform)
    );
  } catch {
    return resolveFallbackName(platform);
  }
};

export const loginDeviceInfo = async (
  options?: JBLoginDeviceInfoOptions
): Promise<JBLoginDeviceInfo> => {
  const platform = Platform.OS;
  const [name, token, notificationToken] = await Promise.all([
    getDeviceName(platform),
    getDeviceIdentityToken(),
    getNotificationToken(options),
  ]);

  return {
    platform,
    name,
    token: token || resolveFallbackToken(platform),
    notificationToken,
  };
};
