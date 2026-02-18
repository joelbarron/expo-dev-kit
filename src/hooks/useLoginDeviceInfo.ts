import { useCallback, useEffect, useState } from 'react';

import { loginDeviceInfo } from '../utils/device-info';

type LoginDeviceInfoState = {
  platform: string;
  name: string;
  token?: string;
  notificationToken?: string;
};

export const useLoginDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<LoginDeviceInfoState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDeviceInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loginDeviceInfo();
      setDeviceInfo(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDeviceInfo();
  }, [refreshDeviceInfo]);

  return {
    deviceInfo,
    isLoading,
    refreshDeviceInfo,
  };
};

