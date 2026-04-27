import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';

import { useColorScheme } from '../../../hooks';
import { useAppConfigStore, useAuthStore } from '../../../runtime';
import { Avatar, AvatarFallbackText, AvatarImage, Box, Heading, HStack, Text, VStack } from '../../../ui';
import { getColor } from '../../../utils';
import { getProfileFullName, getProfilePictureUri, getProfileShortName } from '../../utils';
import { getAuthRoutesConfig, getLastCreatedJBExpoConfig } from '../../../config';

const toTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export type JBUserInfoContext = {
  user: Record<string, any> | null;
  activeProfile: Record<string, any> | null;
  shortName: string;
  username: string;
  profileRoleLabel: string;
  profilePicture: string;
  isHeader: boolean;
};

export type JBUserInfoProps = {
  variant?: 'content' | 'header';
  contentTone?: 'auto' | 'primary' | 'surface';
  onPressEditPhoto?: () => void;
  onPressEditProfile?: () => void;
  titleClassName?: string;
  subtitleClassName?: string;
  editButtonClassName?: string;
  editButtonTextClassName?: string;
  containerClassName?: string;
  rowClassName?: string;
  avatarClassName?: string;
  roleBadgeClassName?: string;
  roleBadgeTextClassName?: string;
  buttonRowClassName?: string;
  bottomContentClassName?: string;
  showRoleBadge?: boolean;
  showUsername?: boolean;
  showActionButtons?: boolean;
  editPhotoText?: string;
  editProfileText?: string;
  bottomContent?: ReactNode;
  renderBottomContent?: (context: JBUserInfoContext) => ReactNode;
};

const resolveRoleLabel = (
  profile: Record<string, any> | null,
  roleOptions: Array<{ value?: string; label?: string }>
): string => {
  const rawRoleValue = toTrimmedString(profile?.role ?? profile?.role_value).toUpperCase();
  if (!rawRoleValue) return '';
  const option = roleOptions.find(
    (roleOption) => toTrimmedString(roleOption?.value).toUpperCase() === rawRoleValue
  );
  return toTrimmedString(option?.label ?? profile?.roleLabel ?? profile?.role_label ?? rawRoleValue);
};

const getDisplayName = (profile: Record<string, any> | null): string => {
  const fallback = 'Usuario';
  const shortName = getProfileShortName(profile as any);
  const fullName = getProfileFullName(profile as any);
  const candidate = toTrimmedString(shortName || fullName || '');
  if (!candidate) return fallback;
  const pieces = candidate.split(' ').filter(Boolean);
  if (pieces.length <= 2) return candidate;
  return `${pieces[0]} ${pieces[1]}`.trim();
};

export const JBUserInfo = ({
  variant = 'content',
  contentTone = 'auto',
  onPressEditPhoto,
  onPressEditProfile,
  titleClassName,
  subtitleClassName,
  editButtonClassName,
  editButtonTextClassName,
  containerClassName,
  rowClassName,
  avatarClassName,
  roleBadgeClassName,
  roleBadgeTextClassName,
  buttonRowClassName,
  bottomContentClassName,
  showRoleBadge = true,
  showUsername = true,
  showActionButtons = true,
  editPhotoText = 'Editar foto',
  editProfileText = 'Editar perfil',
  bottomContent,
  renderBottomContent,
}: JBUserInfoProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const user = useAuthStore((state: any) => (state?.user ?? null) as Record<string, any> | null);
  const activeProfile = useAuthStore((state: any) => (state?.activeProfile ?? null) as Record<string, any> | null);
  const primary = getColor('primary') ?? {};

  const isHeader = variant === 'header';
  const effectiveContentTone = useMemo<'primary' | 'surface'>(() => {
    if (contentTone === 'primary') return 'primary';
    if (contentTone === 'surface') return 'surface';
    return colorScheme === 'dark' ? 'surface' : 'primary';
  }, [colorScheme, contentTone]);
  const isPrimaryTone = !isHeader && effectiveContentTone === 'primary';
  const shortName = useMemo(() => getDisplayName(activeProfile), [activeProfile]);
  const username = toTrimmedString(user?.username ?? activeProfile?.username);
  const roleOptions = useMemo(
    () =>
      ((appConfig?.auth?.profileRoles ?? baseConfig?.auth?.profileRoles ?? []) as Array<{
        value?: string;
        label?: string;
      }>) ?? [],
    [appConfig?.auth?.profileRoles, baseConfig?.auth?.profileRoles]
  );
  const profileRoleLabel = useMemo(() => resolveRoleLabel(activeProfile, roleOptions), [activeProfile, roleOptions]);
  const profilePicture = useMemo(
    () => getProfilePictureUri(activeProfile as any) || getProfilePictureUri(user as any),
    [activeProfile, user]
  );
  const authRoutes = useMemo(
    () =>
      getAuthRoutesConfig({
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          ...(appConfig?.auth ?? {}),
        },
      } as any),
    [appConfig?.auth, baseConfig],
  );
  const profileAccountDataPath = useMemo(
    () =>
      `${authRoutes.accountDataPath}${
        authRoutes.accountDataPath.includes('?') ? '&' : '?'
      }tab=profile`,
    [authRoutes.accountDataPath],
  );

  const handleEditPhoto = () => {
    if (onPressEditPhoto) {
      onPressEditPhoto();
      return;
    }
    router.push(authRoutes.profilePhotoPath as any);
  };

  const handleEditProfile = () => {
    if (onPressEditProfile) {
      onPressEditProfile();
      return;
    }
    router.push(profileAccountDataPath as any);
  };

  const resolvedTitleClassName =
    isHeader || !isPrimaryTone ? 'text-typography-900' : 'text-white';
  const resolvedSubtitleClassName =
    isHeader || !isPrimaryTone ? 'text-typography-500' : 'text-white/85';
  const resolvedEditButtonClassName =
    isHeader || !isPrimaryTone
      ? 'border-outline-200 bg-background-100 dark:border-outline-700 dark:bg-background-200'
      : 'border-white/35 bg-white/15 dark:border-white/35 dark:bg-white/10';
  const resolvedEditTextClassName =
    isHeader || !isPrimaryTone ? 'text-primary-600 dark:text-primary-300' : 'text-white';
  const roleBadgeBaseClassName =
    isHeader || !isPrimaryTone
      ? 'bg-background-100 border border-outline-200 dark:bg-background-200 dark:border-outline-700'
      : 'bg-white/15 border border-white/30 dark:bg-white/10 dark:border-white/25';
  const roleBadgeBaseTextClassName =
    isHeader || !isPrimaryTone ? 'text-typography-700' : 'text-white';
  const avatarBaseClassName =
    isHeader || !isPrimaryTone
      ? 'overflow-hidden rounded-full border border-outline-200 bg-primary-500 dark:border-outline-700'
      : 'overflow-hidden rounded-full border border-white/35 bg-primary-500';
  const editIconColor =
    isHeader || !isPrimaryTone
      ? colorScheme === 'dark'
        ? primary[300] ?? '#67e8f9'
        : primary[600] ?? '#0891b2'
      : '#ffffff';

  const context: JBUserInfoContext = {
    user,
    activeProfile,
    shortName,
    username,
    profileRoleLabel,
    profilePicture,
    isHeader,
  };
  const customBottomNode = renderBottomContent ? renderBottomContent(context) : bottomContent;

  return (
    <Box
      className={`${isHeader ? 'justify-center items-center py-1' : 'justify-center items-center py-5'}${
        containerClassName ? ` ${containerClassName}` : ''
      }`}
    >
      <HStack
        space="md"
        className={`${isHeader ? 'items-center max-w-[85%]' : 'w-[90%] items-center'}${rowClassName ? ` ${rowClassName}` : ''}`}
      >
        <Box>
          <Avatar size={isHeader ? 'md' : 'xl'} className={`${avatarBaseClassName}${avatarClassName ? ` ${avatarClassName}` : ''}`}>
            <AvatarFallbackText>{shortName}</AvatarFallbackText>
            {profilePicture ? <AvatarImage source={{ uri: profilePicture }} /> : null}
          </Avatar>
        </Box>

        <VStack className="flex-1">
          <Heading
            size={isHeader ? 'lg' : 'xl'}
            bold
            className={`${resolvedTitleClassName}${titleClassName ? ` ${titleClassName}` : ''}`}
            numberOfLines={1}
          >
            {shortName}
          </Heading>

          {showRoleBadge && profileRoleLabel ? (
            <Box className={`mt-1 self-start rounded-full px-2.5 py-1 ${roleBadgeBaseClassName}${roleBadgeClassName ? ` ${roleBadgeClassName}` : ''}`}>
              <Text size="xs" className={`font-semibold ${roleBadgeBaseTextClassName}${roleBadgeTextClassName ? ` ${roleBadgeTextClassName}` : ''}`}>
                {profileRoleLabel}
              </Text>
            </Box>
          ) : null}

          {showUsername && username ? (
            <Text
              size={isHeader ? 'sm' : 'md'}
              className={`${resolvedSubtitleClassName}${subtitleClassName ? ` ${subtitleClassName}` : ''}`}
              numberOfLines={1}
            >
              @{username}
            </Text>
          ) : null}

          {!isHeader && showActionButtons ? (
            <HStack className={`mt-2 self-start${buttonRowClassName ? ` ${buttonRowClassName}` : ''}`} space="sm">
              <TouchableOpacity
                onPress={handleEditPhoto}
                activeOpacity={0.85}
              >
                <Box
                  className={`flex-row items-center rounded-lg border px-3 py-1.5 ${resolvedEditButtonClassName}${editButtonClassName ? ` ${editButtonClassName}` : ''}`}
                >
                  <MaterialIcons name="photo-camera" size={14} color={editIconColor} />
                  <Text
                    size="sm"
                    className={`ml-1 font-semibold ${resolvedEditTextClassName}${editButtonTextClassName ? ` ${editButtonTextClassName}` : ''}`}
                  >
                    {editPhotoText}
                  </Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEditProfile}
                activeOpacity={0.85}
              >
                <Box
                  className={`flex-row items-center rounded-lg border px-3 py-1.5 ${resolvedEditButtonClassName}${editButtonClassName ? ` ${editButtonClassName}` : ''}`}
                >
                  <MaterialIcons name="manage-accounts" size={14} color={editIconColor} />
                  <Text
                    size="sm"
                    className={`ml-1 font-semibold ${resolvedEditTextClassName}${editButtonTextClassName ? ` ${editButtonTextClassName}` : ''}`}
                  >
                    {editProfileText}
                  </Text>
                </Box>
              </TouchableOpacity>
            </HStack>
          ) : null}

          {customBottomNode ? (
            <Box className={`w-full${!isHeader ? ' mt-3' : ''}${bottomContentClassName ? ` ${bottomContentClassName}` : ''}`}>
              {customBottomNode}
            </Box>
          ) : null}
        </VStack>
      </HStack>
    </Box>
  );
};
