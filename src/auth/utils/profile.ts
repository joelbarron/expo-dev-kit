type ProfileLike = Record<string, any> | null | undefined;

const pickText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const getProfileFirstName = (profile: ProfileLike): string => {
  if (!profile) return '';
  return (
    pickText(profile.firstName) ||
    pickText(profile.first_name) ||
    pickText(profile.name) ||
    pickText(profile.username) ||
    ''
  );
};

export const getProfileFullName = (profile: ProfileLike): string => {
  if (!profile) return '';

  const first = getProfileFirstName(profile);
  const middle = pickText(profile.middleName) || pickText(profile.middle_name);
  const last1 =
    pickText(profile.lastName) ||
    pickText(profile.last_name) ||
    pickText(profile.lastName1) ||
    pickText(profile.last_name_1);
  const last2 = pickText(profile.lastName2) || pickText(profile.last_name_2);

  return [first, middle, last1, last2].filter(Boolean).join(' ').trim();
};

