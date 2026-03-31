import { Linking } from 'react-native';

import { JBPermissionKey } from '../config';
import { JBPermissionState } from './types';

const permissionDefinitions: Record<
  JBPermissionKey,
  { label: string; description: string }
> = {
  location: {
    label: 'Ubicación',
    description: 'Necesaria para buscar espacios cercanos y centrar el mapa.',
  },
  notifications: {
    label: 'Notificaciones',
    description: 'Permite recibir avisos de reservas y recordatorios.',
  },
  camera: {
    label: 'Cámara',
    description: 'Necesaria para tomar fotos en flujos de cuenta y soporte.',
  },
  media_library: {
    label: 'Fotos y archivos',
    description: 'Necesaria para seleccionar imágenes desde tu galería.',
  },
};

const toPermissionState = (
  status: unknown,
  granted: unknown,
  canAskAgain: unknown
): JBPermissionState => {
  if (granted === true || status === 'granted') {
    return 'granted';
  }

  if (canAskAgain === false || status === 'blocked') {
    return 'blocked';
  }

  if (status === 'undetermined' || status === 'denied') {
    return 'denied';
  }

  return 'unavailable';
};

const safeImport = async (loader: () => Promise<any>) => {
  try {
    return await loader();
  } catch {
    return null;
  }
};

const getLocationStatus = async (): Promise<JBPermissionState> => {
  const Location = await safeImport(() => import('expo-location'));
  if (!Location) return 'unavailable';
  const permission = await Location.getForegroundPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const getNotificationsStatus = async (): Promise<JBPermissionState> => {
  const Notifications = await safeImport(() => import('expo-notifications'));
  if (!Notifications) return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const getCameraStatus = async (): Promise<JBPermissionState> => {
  const ImagePicker = await safeImport(() => import('expo-image-picker'));
  if (!ImagePicker) return 'unavailable';
  const permission = await ImagePicker.getCameraPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const getMediaLibraryStatus = async (): Promise<JBPermissionState> => {
  const ImagePicker = await safeImport(() => import('expo-image-picker'));
  if (!ImagePicker) return 'unavailable';
  const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const requestLocation = async (): Promise<JBPermissionState> => {
  const Location = await safeImport(() => import('expo-location'));
  if (!Location) return 'unavailable';
  const permission = await Location.requestForegroundPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const requestNotifications = async (): Promise<JBPermissionState> => {
  const Notifications = await safeImport(() => import('expo-notifications'));
  if (!Notifications) return 'unavailable';
  const permission = await Notifications.requestPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const requestCamera = async (): Promise<JBPermissionState> => {
  const ImagePicker = await safeImport(() => import('expo-image-picker'));
  if (!ImagePicker) return 'unavailable';
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

const requestMediaLibrary = async (): Promise<JBPermissionState> => {
  const ImagePicker = await safeImport(() => import('expo-image-picker'));
  if (!ImagePicker) return 'unavailable';
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return toPermissionState(
    permission?.status,
    permission?.granted,
    permission?.canAskAgain
  );
};

export const getJBPermissionDefinition = (permission: JBPermissionKey) =>
  permissionDefinitions[permission];

export const getJBPermissionStatus = async (
  permission: JBPermissionKey
): Promise<JBPermissionState> => {
  if (permission === 'location') return getLocationStatus();
  if (permission === 'notifications') return getNotificationsStatus();
  if (permission === 'camera') return getCameraStatus();
  return getMediaLibraryStatus();
};

export const requestJBPermission = async (
  permission: JBPermissionKey
): Promise<JBPermissionState> => {
  if (permission === 'location') return requestLocation();
  if (permission === 'notifications') return requestNotifications();
  if (permission === 'camera') return requestCamera();
  return requestMediaLibrary();
};

export const openDeviceSettings = async () => {
  try {
    await Linking.openSettings();
  } catch {
    // no-op
  }
};
