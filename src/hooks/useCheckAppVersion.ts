import { checkVersion } from 'react-native-check-version';

export type JBCheckAppVersionOptions = {
  stage?: string;
  productionStage?: string;
};

export const createJBCheckAppVersion = (options?: JBCheckAppVersionOptions) => {
  const stage = options?.stage ?? 'PRODUCTION';
  const productionStage = options?.productionStage ?? 'PRODUCTION';

  return async () => {
    if (stage !== productionStage) {
      return {
        needsUpdate: false,
        mandatoryUpdate: false,
        url: ''
      };
    }

    const version = await checkVersion();

    if (!version?.bundleId) {
      throw new Error('Version check failed');
    }

    const mandatoryUpdate =
      version.needsUpdate &&
      typeof version.updateType === 'string' &&
      ['major', 'minor'].includes(version.updateType);

    return { ...version, mandatoryUpdate };
  };
};
