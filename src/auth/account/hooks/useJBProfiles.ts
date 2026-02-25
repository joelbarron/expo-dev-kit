import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '../../../runtime';
import { useJBAuth } from '../../provider';

const normalizeProfileList = (raw: unknown): Array<Record<string, any>> => {
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>;
  }
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>;
    }
  }
  return [];
};

const uniqueProfiles = (profiles: Array<Record<string, any>>): Array<Record<string, any>> => {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    const id = profile?.id ?? profile?.pk;
    const key = id != null ? String(id) : JSON.stringify(profile);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const useJBProfiles = () => {
  const auth = useJBAuth();
  const activeProfile = useAuthStore((state: any) => state?.activeProfile);
  const defaultProfile = useAuthStore((state: any) => state?.defaultProfile);
  const storeProfiles = useAuthStore((state: any) => state?.profiles);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSwitchingProfileId, setIsSwitchingProfileId] = useState<string | null>(null);
  const [fetchedProfiles, setFetchedProfiles] = useState<Array<Record<string, any>> | null>(null);

  const profiles = useMemo(() => {
    const storeMerged = [defaultProfile, activeProfile, ...(Array.isArray(storeProfiles) ? storeProfiles : [])]
      .filter(Boolean) as Array<Record<string, any>>;
    const source = fetchedProfiles && fetchedProfiles.length > 0 ? fetchedProfiles : storeMerged;
    return uniqueProfiles(source);
  }, [activeProfile, defaultProfile, fetchedProfiles, storeProfiles]);

  const refreshProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const response = await auth.getProfiles();
      const normalized = normalizeProfileList(response);
      setFetchedProfiles(normalized);
      return normalized;
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [auth]);

  const switchProfile = useCallback(
    async (profileId: string | number) => {
      const key = String(profileId);
      setIsSwitchingProfileId(key);
      try {
        return await auth.switchProfile({ profile: profileId, client: 'mobile' });
      } finally {
        setIsSwitchingProfileId(null);
      }
    },
    [auth]
  );

  return {
    profiles,
    activeProfile,
    defaultProfile,
    isLoadingProfiles,
    isSwitchingProfileId,
    refreshProfiles,
    switchProfile,
  };
};
